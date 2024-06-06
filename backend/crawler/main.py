from packages import Crawler,MongoDBConnection
from multiprocessing import Process, Queue
import os
import signal
from pymongo import ReturnDocument
from time import sleep
from concurrent.futures import ProcessPoolExecutor
import traceback
from datetime import datetime,timezone
from bson.objectid import ObjectId

def startProcess(config,feed_id):
    try:
        connection = MongoDBConnection()
        db = connection.get_database()
        print('Parent process:', os.getppid())
        print('Process id:', os.getpid())
        config.update({'_id':ObjectId(feed_id)})
        crawler=Crawler(FEED_CONFIG=config,PID=os.getpid(),CONN=connection)
        print("Running crawl: ",feed_id)
        crawler.start()
        crawl = db['feeds'].find_one_and_update(
            {'_id':ObjectId(config['_id'])},
            {"$set":{'crawl.end':datetime.now(timezone.utc),'status':'finished'}},
            return_document=ReturnDocument.AFTER
        )['crawl']
        crawl.update({'feed_id':config['_id']})
        db['logs'].insert_one(crawl)
        print("Finished. Crawl log: {}".format(feed_id))
    except Exception:
        print(traceback.format_exc())
    finally:
        connection.close()

def killProcess(pid,crawlId):
    try: 
        print("Stopping crawl: {} with pid: {}".format(crawlId,pid))
        os.kill(pid, signal.SIGTERM)
        print("Stopped crawl: {}".format(crawlId))
    except Exception:
        print(traceback.format_exc())
    

def fetch_data(q,db):
    data = list(db['queue'].find({"$or":[{'action':'stop'},{'action':'start'}]}))
    if(data):
        for item in data:
            print("Found {} task in queue for {}".format(item['action'],item['feed_id']))
            db['queue'].update_one({'_id':item['_id']},{"$set":{'action':'processed'}})
            q.put(item)

def process_data(item):
    try:
        print("Processing item: {},{},{}".format(item['_id'],item['action'],item['feed_id']))
        if item['action'] == 'start':
            startProcess(item['config'],item['feed_id'])
        elif item['action'] == 'stop':
            killProcess(item['pid'],item['feed_id'])
    except Exception:
        print(traceback.format_exc())

if __name__ == '__main__':
    connection = MongoDBConnection()
    db = connection.get_database()
    print("Starting queue processor.")
    num_cpus = os.cpu_count()
    print("Number of CPUs: ",num_cpus)
    print("Limiting concurrent crawlers to 2x the number of CPUs: ",num_cpus*2)
    # We can use 2x the number of CPUs to maximize the number of workers because the workers are I/O bound
    q = Queue()

    # fetch_process = Process(target=fetch_data, args=(q,))

    with ProcessPoolExecutor(max_workers=num_cpus*2) as executor:
        while True:
            fetch_data(q,db)

            if not q.empty():
                item = q.get()
                executor.submit(process_data, item)

            sleep(1)
        

        
        

        
