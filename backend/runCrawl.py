from feeds import feeds
from packages import Crawler
from concurrent.futures import ProcessPoolExecutor
import traceback
import os

def startCrawl(feed):
    try:
        config = feed['config']
        config.update({'_id':feed['_id']})
        pid = os.getpid()
        crawler=Crawler(FEED_CONFIG=config,PID=pid)
        print("Running crawl: ",feed['_id'],pid)
        crawler.start()
        print("Finished. Crawl log: {}".format(feed['_id']))
    except Exception:
        print(traceback.format_exc())

def fetch_data(q):
    for item in feeds:
        print("Found feed {}".format(item['_id']))
        q.put(item)

if __name__ == '__main__':
    print("Starting {} crawlers".format(len(feeds)))

    num_cpus = os.cpu_count()
    print("Number of CPUs: ",num_cpus)
    print("Limiting concurrent crawlers to 2x the number of CPUs: ",num_cpus*2)

    with ProcessPoolExecutor(max_workers=num_cpus*2) as executor:
        for item in feeds:
            print("Found feed {}".format(item['_id']))
            executor.submit(startCrawl, item)
    
    print("Finished. Exiting...")
    exit(0)