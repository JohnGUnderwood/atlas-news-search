import feedparser
from datetime import datetime
import pymongo
from pymongo import ReturnDocument
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException
import signal
import sys
import traceback
import httpx
from os import getenv,environ
from dotenv import load_dotenv
from time import sleep
import atexit

load_dotenv()

class Crawler:
    def __init__(self,FEED_CONFIG,PID,CONN):
        self.FEED_CONFIG=FEED_CONFIG
        self.PID=PID
        self.FEED_ID=FEED_CONFIG['_id']
        self.CONN=CONN
        self.MDB_DB=CONN.get_database()
        self.DRIVER = MyChromeDriver()
        signal.signal(signal.SIGTERM, self.signal_handler)

    def exit(self,status):
        print('Crawler for {} stopping with status {}'.format(self.FEED_ID,status))
        crawl = self.MDB_DB.feeds.find_one_and_update(
            {'_id':self.FEED_CONFIG['_id']},
            {"$set":{'crawl.end':datetime.now(),'status':status}},
            return_document=ReturnDocument.AFTER
        )['crawl']
        crawl.update({'feed_id':self.FEED_CONFIG['_id']})
        self.MDB_DB.logs.insert_one(crawl)
        self.DRIVER.quit()
        sys.exit(0)

    def signal_handler(self,sig,frame):
        print('SIGTERM received, shutting down')
        self.exit('stopped')
        

    def updateFeed(self,update):
        try:
            self.MDB_DB.feeds.update_one({'_id':self.FEED_CONFIG['_id']},update)
            return
        except Exception as e:
            raise e
    
    def insertEntry(self,session,entry,chunks):
        try:
            docs_collection = self.MDB_DB.docs
            feeds_collection = self.MDB_DB.feeds
            chunks_collection = self.MDB_DB.docs_chunks
            docs_collection.insert_one(entry,session=session)
            feeds_collection.update_one({'_id':self.FEED_ID},{"$push":{"crawl.inserted":entry['id']}},session=session)
            if len(chunks) > 0:
                chunks_collection.insert_many(chunks,session=session)
            print("Crawler {}: Entry update transaction successful".format(self.FEED_ID))
            return
        except pymongo.errors.DuplicateKeyError:
            print("Crawl {} entry {} already exists in database".format(self.FEED_ID,entry['id']))
            raise DuplicateEntryException("Entry id {} already exists".format(entry['id']))
        except Exception as e:
            raise e
        
    def processItem(self,item):
        try:
            entry = Entry(
                DATA=item,
                SELECTORS=self.FEED_CONFIG['content_html_selectors'],
                LANG=self.FEED_CONFIG['lang'],
                ATTRIBUTION=self.FEED_CONFIG['attribution'],
                DRIVER=self.DRIVER,
                DATE_FORMAT=self.FEED_CONFIG['date_format'],
                NAMESPACE=self.FEED_CONFIG['namespace'],
                CUSTOM_FIELDS=self.FEED_CONFIG.get('custom_fields',None)
                ).processEntry()
            entry.update({'feed_id':self.FEED_ID})
            chunks = self.chunkEntryContent(entry)
            try:
                with self.CONN.get_session() as session:
                    session.with_transaction(lambda session: self.insertEntry(session,entry,chunks))
            except Exception as e:
                print("Crawler {} failed to insert entry for item {}".format(self.FEED_ID,entry['id']),e)
                self.updateFeed({'$push':{'crawl.errors':{'entryId':entry['id'],'error':str(e)}}})
        except Exception as e:
            print("Crawler {} failed to create Entry object for item {}".format(self.FEED_ID,item['id']),e)
            self.updateFeed({'$push':{'crawl.errors':{'entryId':item['id'],'error':str(e)}}})
    
    def chunkEntryContent(self,entry):
        chunks = []
        try:
            if len(entry['content'][entry['lang']]) > 0:
                for i,paragraph in enumerate(entry['content'][entry['lang']]):
                    content = f"# {entry['title'][entry['lang']]}\n## Paragraph {i+1}\n{paragraph}"
                    chunk = {
                        'parent_id':entry['id'],
                        'type':'paragraph',
                        'content':content,
                        'chunk':i,
                        'lang':entry['lang'],
                        'feed_id':self.FEED_ID,
                        'attribution':entry['attribution'],
                        'link':entry['link'],
                        'title':entry['title'][entry['lang']],
                        'namespace':[entry['namespace']]
                    }
                    if 'tags' in entry:
                        chunk.update({'tags':entry['tags']})
                    if 'published' in entry:
                        chunk.update({'published':entry['published']})
                    
                    chunks.append(chunk)
            return chunks   
        except Exception as e:
            raise Exception("Failed to chunk entry content. {}".format(e))
        
    def start(self):
        config = self.FEED_CONFIG
        crawl = {'pid':self.PID,'start':datetime.now(),'crawled':[],'inserted':[],'errors':[],'duplicates':[]}
        self.updateFeed({"$set":{'crawl':crawl,'status':'running'}})
        try:
            feed = MyFeedParser(config['url']).parseFeed()
        except Exception as e:
            self.updateFeed({'$push':{'crawl.errors':{'error':str(e)}}})
            self.exit('failed')

        for item in feed.entries:
            self.updateFeed({"$push":{"crawl.crawled":item['id']}})
            if self.MDB_DB.docs.find_one({'_id':item['id']},{'_id':1}):
                self.updateFeed({'$push':{'crawl.duplicates':item['id']}})
            else:
                self.processItem(item)
                # backoff so we don't get banned by websites
                sleep(1)

        self.exit('finished')
        return
    
class Entry:
    def __init__(self,DATA,SELECTORS,LANG,ATTRIBUTION,DRIVER,DATE_FORMAT,NAMESPACE,CUSTOM_FIELDS):
        self.DATA=DATA
        self.SELECTORS=SELECTORS
        self.LANG=LANG
        self.ATTRIBUTION=ATTRIBUTION
        self.DRIVER=DRIVER
        self.DATE_FORMAT=DATE_FORMAT
        self.NAMESPACE=NAMESPACE
        self.CUSTOM_FIELDS=CUSTOM_FIELDS
    
    def get(self):
        return self.DATA

    def parseContent(self,html):
        errors = []
        content = []
        try:
            soup = BeautifulSoup(html, "html.parser")
            if len(soup.body) < 1:
                errors.append({'error':"Page returned empty body tag"})   
            
            else:
                tags = []
                for selector in self.SELECTORS:
                    tags += soup.select(selector)
                
                if len(tags) < 1:
                    errors.append("Failed to find content with any selector: {}".format(self.SELECTORS))
                else:
                    for i,tag in enumerate(tags):
                        content.append(tag.text.strip())

            return content,errors
        except Exception as e:
            raise Exception("Failed to parse content. {}".format(traceback.format_exc()))
        
    def processEntry(self):
        entry = self.DATA
        lang = self.LANG
        attribution = self.ATTRIBUTION
        driver = self.DRIVER
        content = {lang:''}
        custom_fields = self.CUSTOM_FIELDS
        try:
            text = ''
            errors = []
            try:
                html = driver.fetchPage(entry.link)
                try:
                    text,errors = self.parseContent(html)
                except Exception as e:
                    raise e
            except EntryParseException as e:
                errors.append({'error':str(e)})
            except Exception as e:
                raise Exception("Failed to fetch page for entry {}. {}".format(entry.link,traceback.format_exc()))
            
            if len(errors) > 0:
                content.update({'errors':errors})
            content.update({lang:text})
            entry.update({'content':content})
            entry.update({'_id':entry.id})
            if 'media_thumbnail' in entry: entry.update({'media_thumbnail':entry.media_thumbnail[0]['url']})
            if 'summary' in entry:
                # Summary might contain tags. We want to just get the text.
                # There might also be an image in there. We can grab that too.
                try:
                    soup = BeautifulSoup(entry.summary, 'html.parser')
                    summary_text=soup.get_text()
                    entry.update({'summary':{lang:summary_text}})

                    # Check if there is an image in the summary
                    img = soup.find('img')
                    if img and 'media_thumbnail' not in entry and img.get('src') != '':
                        entry.update({'media_thumbnail':img.get('src')})

                except TypeError:
                    entry.update({'summary':{lang:entry.summary}})
                    
            if 'title' in entry: entry.update({'title':{lang:entry.title}})
            if 'published' in entry:
                published_date = ''
                try:
                    published_date = datetime.strptime(entry.published,self.DATE_FORMAT)
                except ValueError as e:
                    print("Failed to parse date {} with format {}. Using current date instead".format(entry.published,self.DATE_FORMAT))
                    published_date = datetime.now()
                entry.update({'published':published_date})
            if 'tags' in entry:
                tagList = []
                for tag in entry.tags:
                    tagList += tag['term'].split(',')
                entry.update({'tags':tagList})
            if 'authors' in entry: entry.update({'authors':[ author['name'] for author in entry.authors if 'name' in author ]})
            if 'author' in entry:
                if not 'authors' in entry:
                    entry.update({'authors':entry.author})
            
            if custom_fields:
                for field in custom_fields:
                    if field in entry:
                        entry.update({field:entry[field].split(',')})
            
            entry.update({'lang':lang})
            entry.update({'attribution':attribution})
            entry.update({'namespace':self.NAMESPACE})
            self.DATA = entry
            return self.DATA
        except Exception as e:
            raise e

class MyFeedParser:
    def __init__(self,feed_url):
        self.feed_url = feed_url
    
    def parseFeed(self):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
            }

            # Create a client that supports HTTP/2
            with httpx.Client(http2=True) as client:
                response = client.get(self.feed_url, headers=headers)
                self.feed = feedparser.parse(response.content)
            return self.feed
        except Exception as e:
            raise Exception("Failed to parse feed url {}. {}".format(self.feed_url,e))

class MongoDBConnection:
    def __init__(self):
        self.url = getenv("MDBCONNSTR")
        self.db_name = getenv("MDB_DB",default="news-demo")
        try:
            self.client = pymongo.MongoClient(self.url)
            self.client.admin.command('ping')
            try:
                self.db = self.client.get_database(self.db_name)
            except Exception as e:
                raise Exception("Failed to connect to {}. {}".format(self.db_name,e))
        except Exception as e:
            raise Exception("Failed to connect to MongoDB. {}".format(self.db_name,e))
        atexit.register(self.close)

    def get_database(self):
        return self.db
    
    def get_session(self):
        return self.client.start_session()

    def close(self):
        self.client.close()

class MyChromeDriver:
    def __init__(self):
        self.options = webdriver.ChromeOptions()
        self.options.binary_location = getenv('CHROME_PATH')
        self.options.add_argument("--headless")
        self.options.add_argument('--ignore-certificate-errors')
        self.options.add_argument('--disable-dev-shm-usage')
        self.options.add_argument('--no-sandbox')

        # Try to avoid getting blocked
        self.options.add_argument("user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6331.0")
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        
        self.driver = webdriver.Chrome(service=Service(getenv('CHROMEDRIVER_PATH')),options=self.options)
        self.driver.set_page_load_timeout(5)

    def fetchPage(self,link):
        print("Fetching page from {}".format(link))
        try:
            self.driver.get(link)
            html = self.driver.page_source
            return html
        except TimeoutException as e:
            raise EntryParseException("Failed to fetch page from {}. {}".format(link,e),cause='PageTimeoutError')
        except Exception:
            raise Exception("Fetching page failed. {}".format(traceback.format_exc()))
    
    def quit(self):
        self.driver.quit()
        print("Quitting ChromeDriver")

class DuplicateEntryException(Exception):
    def __init__(self, message):
        super().__init__(message)

class EntryParseException(Exception):
    def __init__(self, message, cause=None):
        super().__init__(message)
        self.cause = cause
    
class Embeddings():
    def __init__(self):
        self.provider = getenv("PROVIDER")
        self.api_key = getenv("EMBEDDING_API_KEY",None)
        # Embedding services. Default to using Azure OpenAI.
        if self.provider == "openai":
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)
            self.model = getenv("EMBEDDING_MODEL","text-embedding-ada-002")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",1536)
        elif self.provider == "vectorservice":
            import requests
        elif self.provider == "mistral":
            from mistralai.client import MistralClient
            self.client = MistralClient(api_key=self.api_key)
            self.model = getenv("EMBEDDING_MODEL","mistral-embed")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",1024)
        elif self.provider == "azure_openai":
            from openai import AzureOpenAI
            self.client = AzureOpenAI(
                api_key=self.api_key,
                api_version="2023-12-01-preview",
                azure_endpoint=getenv("OPENAIENDPOINT")
            )
            self.model = getenv("OPENAIDEPLOYMENT")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",1536)
        elif self.provider == "fireworks":
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.fireworks.ai/inference/v1"
            )
            self.model = getenv("EMBEDDING_MODEL","nomic-ai/nomic-embed-text-v1.5")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",768)
        elif self.provider == "nomic":
            from nomic import embed as nomic_embed
            environ["NOMIC_API_KEY"] = self.api_key
            self.model = getenv("EMBEDDING_MODEL","nomic-embed-text-v1.5")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",768)
        else:
            print("No valid provider specified. Defaulting to Azure OpenAI and OPENAIAPIKEY variable.")
            self.provider = "azure_openai"
            from openai import AzureOpenAI
            self.client = AzureOpenAI(
                api_key=getenv("OPENAIAPIKEY"),
                api_version="2023-12-01-preview",
                azure_endpoint=getenv("OPENAIENDPOINT")
            )
            self.model = getenv("OPENAIDEPLOYMENT")
            self.dimensions = getenv("EMBEDDING_DIMENSIONS",1536)
        print("Using provider: ",self.provider)
        print("Using model: ",self.model)
        print("Using dimensions: ",self.dimensions) 
    
    def get_embedding_VectorService(embed_text):
        response = requests.get(getenv("VECTOR_SERVICE_URL"), params={"text":embed_text }, headers={"accept": "application/json"})
        vector_embedding = response.json()
        return vector_embedding

    # Function to get embeddings from OpenAI
    def get_embedding_OpenAI(self,text):
        text = text.replace("\n", " ")
        if(self.dimensions):
            vector_embedding = self.client.embeddings.create(input = [text], model=self.model, dimensions=self.dimensions).data[0].embedding
        else:
            vector_embedding = self.client.embeddings.create(input = [text], model=self.model,).data[0].embedding
        return vector_embedding

    # Function to get embeddings from Azure OpenAI
    def get_embedding_Azure_OpenAI(self,text):
        text = text.replace("\n", " ")
        vector_embedding = self.client.embeddings.create(input = [text], model=self.model).data[0].embedding
        return vector_embedding

    # Function to get embeddings from Mistral
    def get_embedding_Mistral(self,text):
        vector_embedding = self.client.embeddings(model=self.model, input=[text]).data[0].embedding
        return vector_embedding

    # Function to get embeddings from Fireworks.ai
    def get_embedding_Fireworks(self,text):
        text = text.replace("\n", " ")
        vector_embedding = self.client.embeddings.create(
            model=self.model,
            input=f"search document: {text}",
            dimensions=self.dimensions
        ).data[0].embedding
        return vector_embedding

    def get_embedding_Nomic(self,text):
        vector_embedding = nomic_embed.text(
            texts=[text],
            model=self.model,
            task_type="search_document",
            dimensionality=self.dimensions
        )['embeddings']
        return vector_embedding
    
    # Providing multiple embedding services depending on config
    def get_embedding(self,text):
        if self.provider == "openai":
            return self.get_embedding_OpenAI(text)
        elif self.provider == "vectorservice":
            return self.get_embedding_VectorService(text)
        elif self.provider == "mistral":
            return self.get_embedding_Mistral(text)
        elif self.provider == "azure_openai":
            return self.get_embedding_Azure_OpenAI(text)
        elif self.provider == "fireworks":
            return self.get_embedding_Fireworks(text)
        elif self.provider == "nomic":
            return self.get_embedding_Nomic(text)