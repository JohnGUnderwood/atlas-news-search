from feeds import feeds
from packages import MongoDBConnection

connection=MongoDBConnection()
db=connection.get_database()

installed = list(db["feeds"].find())
if len(installed) < 1:
    db['feeds'].insert_many(feeds)
    print("Installed all feeds: {}".format(", ".join([str(feed["_id"]) for feed in feeds])))
else:
    for feed in feeds:
        print("Processing feed {}".format(feed['name']))
        if feed['name'] in [item['name'] for item in installed]:
            print("\tFeed is already installed") 
        else:
            print("\tAdding config for feed.")
            db['feeds'].insert_one(feed)
connection.close()