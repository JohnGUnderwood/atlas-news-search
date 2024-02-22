from os import getenv, getcwd, mkdir
from shutil import rmtree
from dotenv import load_dotenv
import pymongo
import feedparser
from feeds import feeds
from datetime import datetime
import bson
import requests
from bs4 import BeautifulSoup
from selenium import webdriver

load_dotenv()

MDB_URI=getenv("MDB_URI")
MDB_DB=getenv("MDB_DB")

def connect(url):
    try:
        client = pymongo.MongoClient(url)
        client.admin.command('ping')
        try:
            db = client.get_database(MDB_DB)
            print("Successfully connected to MongoDB {} database!".format(MDB_DB))
            return [client,db]
        except Exception as e:
            print(e)
            print("Failed to connect to {}. Quitting.".format(MDB_DB))
            exit()
    except Exception as e:
        print(e)
        print("Failed to connect to MongoDB. Quitting.")
        exit()

def setup():
    installed = list(db["feeds"].find())
    if len(installed) < 1:
        db['feeds'].insert_many(feeds)
        print("Installed all feeds: {}".format(", ".join([feed["_id"] for feed in feeds])))
    else:
        for feed in feeds:
            print("Processing feed {}".format(feed['_id']))
            if feed['_id'] in [item['_id'] for item in installed]:
                print("\tFeed is already installed") 
            else:
                print("\tAdding config for feed.")
                db['feeds'].insert_one(feed)

def addEntry(session,logId=None,entry=None):
    try:
        docs_collection = session.client[MDB_DB].docs
        logs_collection = session.client[MDB_DB].logs
        resp = docs_collection.insert_one(entry,session=session)
        logs_collection.update_one({'_id':logId},{"$push":{"crawled":entry.id,"inserted":bson.ObjectId(resp.inserted_id)}},session=session)
    
        print("Entry update transaction successful")
        return
    except Exception as e:
        raise e


def getWebContent(entry,selector,dir):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36"}
        r = requests.get(
                entry.link,
                headers=headers
            ).text

        file = open('{}/{}.html'.format(dir,entry.id),'wt')
        file.write(r)
        file.close()

        options = webdriver.ChromeOptions()
        options.add_argument("headless")
        browser = webdriver.Chrome(options=options)
        browser.get('file://{}/{}.html'.format(dir,entry.id))
        html = browser.page_source
        browser.quit()

        soup = BeautifulSoup(html, "html.parser")
        tags = soup.select(selector)

        content = ""
        for tag in tags:
            content+=tag.text.strip()

        return content
    except Exception as e:
        raise e

def processEntry(entry,logId,config,dir):
    try:
        entry.update({'content':{config['lang']:getWebContent(entry,config['content_html_selector'],dir)}})
        entry.update({'summary':{config['lang']:entry.summary}})
        entry.update({'title':{config['lang']:entry.title}})
        entry.update({'published':datetime.strptime(entry.published, config['date_format'])})
        entry.update({'media_thumbnail':entry.media_thumbnail[0]['url']})
        entry.update({'tags':[tag['term'] for tag in entry.tags]})
        entry.update({'authors':[author['name'] for author in entry.authors]})
        entry.update({'lang':config['lang']})
        entry.update({'attribution':config['attribution']})
        with client.start_session() as session:
            session.with_transaction(lambda session: addEntry(session,logId=logId,entry=entry))
    except Exception as e:
        print(e)
        db['logs'].update_one({'_id':logId},{'$push':{'errors':{'entryId':entry.id,'error':e}}})

def crawl(config):
    dir  = '{}/{}'.format(getcwd(),config['_id'])
    mkdir(dir)
    feed = feedparser.parse(config['url'])
    db['feeds'].update_one({'_id':config['_id']},{"$set":{'lastCrawl':datetime.now()}})
    r = db['logs'].insert_one({'feedId':config['_id'],'start':datetime.now(),'crawled':[],'inserted':[],'errors':[]})
    logId = bson.ObjectId(r.inserted_id)
    if 'lastCrawl' in config:
        lastCrawl = config["lastCrawl"]
        if lastCrawl < datetime.strptime(feed.feed.updated,config['date_format']):
            for entry in feed.entries:
                entry_date = datetime.strptime(entry.published, config['date_format'])
                if entry_date > lastCrawl:
                    processEntry(entry,logId,config,dir)
    else:
        for entry in feed.entries:
            processEntry(entry,logId,config,dir)

    db['logs'].update_one({'_id':logId},{"$set":{'status':'stopped','end':datetime.now()}})
    rmtree(dir)

client, db = connect(MDB_URI)
setup()
installed = list(db["feeds"].find())
for config in installed:
    crawl(config)

# from flask import Flask
# app = Flask(__name__)

# @app.get("/start/<string:feedId>")
# def startCrawl(feedId):
#     config = db['feeds'].find_one({'_id':feedId})
#     if config['status'] == 'stopped':
#         db['feeds'].update_one({'_id':config['_id']},{"$set":{'status':'running'}})
#         crawl(config)
#         db['feeds'].update_one({'_id':config['_id']},{"$set":{'status':'stopped'}})
#         return 
#     else:
#         return "<p>Feed {} alread running</p>"




