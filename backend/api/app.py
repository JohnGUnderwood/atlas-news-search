from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from bson.json_util import dumps
from bson.objectid import ObjectId
import json
from packages import Entry,MyChromeDriver,MongoDBConnection,MyFeedParser,Embeddings
import traceback

def returnPrettyJson(data):
    try:
        return jsonify(**json.loads(dumps(data)))
    except TypeError:
        try:
            return jsonify(*json.loads(dumps(data)))
        except TypeError:
            try: 
                return dumps(data)
            except TypeError:
                return repr(data)
        
def test(config):
    try:
        feed = MyFeedParser(config['url']).parseFeed()
        try:
            entry = Entry(
                DATA=feed.entries[0],
                SELECTORS=config['content_html_selectors'],
                LANG=config['lang'],
                ATTRIBUTION=config['attribution'],
                DRIVER=driver,
                DATE_FORMAT=config['date_format'],
                NAMESPACE=request.headers.get('User','all'),
                CUSTOM_FIELDS=config.get('custom_fields',None)
            ).processEntry()
        except Exception as e:
            return {"error":str(traceback.format_exc())},200
        return returnPrettyJson(entry),200
    except Exception as e:
        return returnPrettyJson(e),200

def get_results(collection, pipeline):
    try:
        results = list(collection.aggregate(pipeline))
        return results
    except Exception as error:
        raise error

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
connection = MongoDBConnection()
db = connection.get_database()
driver = MyChromeDriver()
embedder =  Embeddings()
languages = ['en','es','fr']

@app.post('/test')
def testConfig():
    try:
        return test(request.json)
    except Exception as e:
        return returnPrettyJson(e),200
    
@app.get("/feeds")
def getFeeds():
    try:
        feedList = list(db['feeds'].find({"$or":[{"config.namespace":"all"},{"config.namespace":request.headers.get('User','')}]}))
        feedDict = {str(feed['_id']): feed for feed in feedList}
        return returnPrettyJson(feedDict), 200
    except Exception as e:
        return returnPrettyJson(e),500

@app.post("/feeds")
def postFeed():
    try:
        request.json['config']['namespace'] = request.headers.get('User','all')
        db['feeds'].insert_one(request.json)
        feedList = list(db['feeds'].find({}))
        feedDict = {str(feed['_id']): feed for feed in feedList}
        return returnPrettyJson(feedDict), 200
    except Exception as e:
        return returnPrettyJson(e),500
    
@app.get("/feeds/search")
def searchFeeds():
    query = request.args.get('q', default = "", type = str)
    try:
        feedList = list(db['feeds'].aggregate([
            {"$search":{
                "compound":{
                    "minimumShouldMatch":1,
                    "should":[
                        {"autocomplete":{"query":query,"path":"name"}},
                        {"autocomplete":{"query":query,"path":"config.attribution"}},
                        {"autocomplete":{"query":query,"path":"config.url"}}
                    ],
                    "filter":[
                        {
                            "in":{
                                "path":"config.namespace",
                                "value":[request.headers.get('User',''),'all']
                            }
                        }
                    ]
                }
            }}
        ]))
        feedDict = {str(feed['_id']): feed for feed in feedList}
        return returnPrettyJson(feedDict), 200
    except Exception as e:
        return returnPrettyJson(e),500

@app.get("/feed/<string:feedId>")
def getFeed(feedId):
    try:
        config = db['feeds'].find_one({'_id':ObjectId(feedId)})
        return returnPrettyJson(config), 200
    except Exception as e:
        return returnPrettyJson(e),500

@app.delete("/feed/<string:feedId>")
def deleteFeed(feedId):
    try:
        config = db['feeds'].find_one_and_delete({'_id':ObjectId(feedId)})
        return returnPrettyJson(config), 200
    except Exception as e:
        return returnPrettyJson(e),500
    
@app.get("/feed/<string:feedId>/history")
def getFeedCrawlHistory(feedId):
    try:
        crawls = list(db['logs'].find({'feed_id':feedId}).sort('end',-1))
        return returnPrettyJson(crawls)
    except Exception as e:
        return returnPrettyJson(e),500

@app.get("/feed/<string:feedId>/history/clear")
def deleteFeedCrawlHistory(feedId):
    try:
        db['logs'].delete_many({'feed_id':feedId})
        db['feeds'].update_one({'_id':ObjectId(feedId)},{"$unset":{'crawl':1}})
        r = db['feeds'].find_one({'_id':ObjectId(feedId)})
        return returnPrettyJson(r),200
    except Exception as e:
        return returnPrettyJson(e),500

@app.get("/feed/<string:feedId>/test")
def testFeed(feedId):
    try:
        f = db['feeds'].find_one({'_id':ObjectId(feedId)},{'config':1})
        return test(config=f['config'])
    except Exception as e:
        return returnPrettyJson(e),200

@app.get("/feed/<string:feedId>/start")
def queueCrawl(feedId):
    try:
        q = db['queue'].find_one({'feed_id':feedId,'action':'start'})
        
        if q:
            return returnPrettyJson({'msg':'Feed {} already in queue to start'.format(feedId)}),200
        
        f = db['feeds'].find_one({'_id':ObjectId(feedId)},{'status':1,"crawl":1,'config':1})
        if not 'status' in f or f['status'] == 'stopped' or f['status'] == 'finished':
            crawlConfig = f['config']
            r = db['queue'].insert_one({'action':'start','feed_id':feedId,'config':crawlConfig})
            return returnPrettyJson({'status':'starting','queued_task':r.inserted_id}),200
        elif f['status'] == 'running':
            return returnPrettyJson({'msg':'Feed {} already running'.format(feedId),'crawl':f['crawl'],'status':f['status']}),200
    except Exception as e:
        return returnPrettyJson(e),500

@app.get("/feed/<string:feedId>/stop")
def queueStopCrawl(feedId):
    try:
        q = db['queue'].find_one({'feed_id':feedId,'action':'stop'})
        if q:
            return returnPrettyJson({'msg':'Feed {} already in queue to stop'.format(feedId)}),200
        
        f = db['feeds'].find_one({'_id':ObjectId(feedId)},{"pid":"$crawl.pid",'status':1})
        if 'status' in f:
            if f['status'] == 'running':
                try:
                    r = db['queue'].insert_one({'action':'stop','feed_id':feedId,'pid':f['pid']})
                    return returnPrettyJson({'pid':f['pid'],'status':'stopping'}),200
                except Exception as e:
                    return returnPrettyJson(e),500
            elif f['status'] != 'running':
                return returnPrettyJson({'msg':'Feed {} is not running'.format(feedId),'status':f['status']}),200
        else:
            return returnPrettyJson({'msg':'Feed {} already stopped'.format(feedId),'status':'not run'}),200
    except Exception as e:
        return returnPrettyJson(e),500

@app.route('/search/fts', methods=['POST'])
def searchFTS():
    try:
        if 'q' not in request.args:
            return returnPrettyJson({"error": "Request missing 'q' param"}), 400
        else:
            query = request.args.get('q', default = "", type = str)
            text_op = {
                "text": {
                    "query": query,
                    "path": [
                        {"wildcard": 'title.*'},
                        {"wildcard": 'summary.*'},
                        {"wildcard": 'content.*'}
                    ]
                }
            }

            search_opts = {
                "index": "searchIndex",
                "compound": {
                    "must": [text_op],
                    "filter": [
                        {
                            "in":{
                                "path":"namespace",
                                "value":[request.headers.get('User',''),'all']
                            }
                        }
                    ]
                },
                "highlight": {
                    "path": [
                        {"wildcard": 'summary.*'},
                        {"wildcard": 'content.*'}
                    ]
                },
                "sort": {
                    "score": {"$meta": "searchScore"},
                    "published": -1
                }
            }

            if request.json.get('page') == 'next' and request.json.get('paginationToken'):
                search_opts["searchAfter"] = request.json.get('paginationToken')
            elif request.json.get('page') == 'prev' and request.json.get('paginationToken'):
                search_opts["searchBefore"] = request.json.get('paginationToken')

            if request.json.get('filters') and len(request.json.get('filters')) > 0:
                for field, filter in request.json.get('filters').items():
                    if filter["type"] == "equals":
                        opt = {
                            "equals": {
                                "path": field,
                                "value": filter["val"]
                            }
                        }
                        search_opts["compound"]["filter"].append(opt)

            pipeline = [
                {
                    "$search": search_opts
                },
                {
                    "$limit": int(request.json.get('pageSize')) if request.json.get('pageSize') else 4
                },
                {
                    "$project": {
                        "title": '$title',
                        "image": '$media_thumbnail',
                        "description": '$summary',
                        "highlights": {"$meta": "searchHighlights"},
                        "score": {"$meta": "searchScore"},
                        "paginationToken": {"$meta": 'searchSequenceToken'},
                        "lang": 1,
                        "attribution": 1,
                        "link": 1
                    }
                }
            ]

            try:
                response = get_results(db['docs'], pipeline)
                if request.json.get('page') == 'prev' and request.json.get('paginationToken'):
                    return returnPrettyJson({"results": list(reversed(response)), "query": pipeline})
                else:
                    return returnPrettyJson({"results": response, "query": pipeline})
            except Exception as error:
                return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500

@app.route('/search/meta', methods=['POST']) 
def searchMeta():
    try:
        if 'q' not in request.args:
            return returnPrettyJson({"error": "Request missing 'q' param"}), 400
        else:
            query = request.args.get('q', default = "", type = str)
            text_op = {
                "text": {
                    "query": query,
                    "path": [
                        {"wildcard": 'title.*'},
                        {"wildcard": 'summary.*'},
                        {"wildcard": 'content.*'}
                    ]
                }
            }

            search_opts = {
                "index": "searchIndex",
                "compound": {
                    "must": [text_op],
                    "filter": [
                        {
                            "in":{
                                "path":"namespace",
                                "value":[request.headers.get('User',''),'all']
                            }
                        }
                    ]
                }
            }

            if 'filters' in request.json and len(request.json['filters']) > 0:
                for field, filter in request.json['filters'].items():
                    if filter['type'] == "equals":
                        opt = {
                            "equals": {
                                "path": field,
                                "value": filter['val']
                            }
                        }
                        search_opts['compound']['filter'].append(opt)

            pipeline = [
                {
                    "$searchMeta": {
                        "index": "searchIndex",
                        "count": {"type": "total"},
                        "facet": {
                            "operator": {
                                "compound": search_opts['compound']
                            },
                            "facets": {
                                "attribution": {
                                    "type": "string",
                                    "path": "attribution"
                                },
                                "lang": {
                                    "type": "string",
                                    "path": "lang"
                                },
                                "authors": {
                                    "type": "string",
                                    "path": "authors"
                                },
                                "tags": {
                                    "type": "string",
                                    "path": "tags"
                                }
                            }
                        }
                    }
                }
            ]

            try:
                meta = get_results(db['docs'], pipeline)
                hits = meta[0]['count']['total']
                return returnPrettyJson({"facets": meta[0]['facet'], "query": pipeline, "hits": hits})
            except Exception as error:
                return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500


@app.route('/search/rsf', methods=['POST'])
def searchRSF():
    try:
        if 'q' not in request.args:
            return returnPrettyJson({"error": "Request missing 'q' param"}), 400
        else:
            query = request.args.get('q', default = "", type = str)
            scalar = request.json.get('scalar',{"vector":0.5,"fts":0.5})
            vector_scalar = scalar.get('vector',0.5)
            fts_scalar = scalar.get('fts',0.5)
            text_op = {
                "text": {
                    "query": query,
                    "path": "content"
                }
            }

            search_opts = {
                "index": "searchIndex",
                "compound": {
                    "must": [text_op],
                    "filter": [
                        {
                            "in":{
                                "path":"namespace",
                                "value":[request.headers.get('User',''),'all']
                            }
                        }
                    ]
                },
                "highlight": {
                    "path": "content"
                }
            }

            vector_opts = {
                "index":"vectorIndex",
                "path":"embedding",
                "queryVector": embedder.get_embedding(query),
                "numCandidates":250,
                "limit":50,
                "filter":{
                    "$and":[
                        {
                            "$or":[
                                {"namespace":{"$eq":request.headers.get('User','')}},
                                {"namespace":{"$eq":'all'}}
                            ]
                        }
                    ]
                }
            }

            if 'filters' in request.json and len(request.json['filters']) > 0:
                vector_opts['filter']['$and'].append({"$or":[]})
                for field, filter in request.json['filters'].items():
                    if filter['type'] == 'equals':
                        v_opt = {field: {'$eq': filter['val']}}
                        s_opt = {
                            'equals': {
                                'path': field,
                                'value': filter['val']
                            }
                        }
                        vector_opts['filter']['$and'][1]["$or"].append(v_opt)
                        search_opts['compound']['filter'].append(s_opt)

            pipeline = [
                {
                    "$vectorSearch":vector_opts
                },
                {
                    "$addFields": {"vs_score": {"$multiply": [vector_scalar, {"$divide": [1, {"$sum": [1, {"$exp": {"$multiply": [-1, {"$meta":"vectorSearchScore"}]}}]}]}]}}
                },
                {
                    "$unset":"embedding"
                },
                {
                    "$unionWith": {
                        "coll": "docs_chunks",
                        "pipeline": [
                            {
                                "$search":search_opts
                            },
                            {"$addFields": {"fts_score": {"$multiply": [fts_scalar, {"$divide": [1, {"$sum": [1, {"$exp": {"$multiply": [-1, {"$meta": "searchScore"}]}}]}]}]}}},
                            {
                                "$unset":"embedding"
                            }
                        ],
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "vs_score": {"$max": "$vs_score"},
                        "fts_score": {"$max": "$fts_score"},
                        "title": {"$first": "$title"},
                        "chunk": {"$first": "$description"},
                        "lang": {"$first": "$lang"},
                        "attribution": {"$first": "$attribution"},
                        "link": {"$first": "$link"},
                        "content": {"$first": "$content"},
                        "parent_id": {"$first": "$parent_id"},
                    }
                },
                {
                    "$addFields": {
                        "score": {
                            "$add": [{"$ifNull": ["$fts_score", 0]}, {"$ifNull": ["$vs_score", 0]}],
                        },
                    }
                },
                {
                    "$sort": {"score": -1}
                },
                {
                    "$group": {
                        "_id": "$parent_id",
                        "chunks": { "$push": "$$ROOT" },
                        "lang": { "$first": "$lang" },
                        "title": { "$first": "$title" },
                        "attribution": { "$first": "$attribution" },
                        "link": { "$first": "$link" },
                        "max": { "$max": "$score" },
                        "avg": { "$avg": "$score" },
                        "sum": { "$sum": "$score" },
                        "count": { "$count": {} }
                    }
                },
                {
                    "$project":{
                        "parent":"$_id",
                        "chunks":1,
                        "lang":1,
                        "attribution":1,
                        "link":1,
                        "title":1,
                        "score":{
                            "avg":"$avg",
                            "max":"$max",
                            "sum":"$sum",
                            "count":"$count"
                            }
                        }
                },
                {
                    "$sort":{
                        "score.max":-1
                    }
                }
            ]

            try:
                response = get_results(db['docs_chunks'], pipeline)
                return returnPrettyJson({"results": response, "query": pipeline})
            except Exception as error:
                return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500

@app.route('/search/vector', methods=['POST'])
def vectorSearch():
    try:
        if 'q' not in request.args:
            return returnPrettyJson({"error": "Request missing 'q' param"}), 400
        else:
            query = request.args.get('q', default = "", type = str)

            vector_opts = {
                "index":"vectorIndex",
                "path":"embedding",
                "queryVector": embedder.get_embedding(query),
                "numCandidates":250,
                "limit":50,
                "filter":{
                    "$and":[
                        {
                            "$or":[
                                {"namespace":{"$eq":request.headers.get('User','')}},
                                {"namespace":{"$eq":'all'}}
                            ]
                        }
                    ]
                }
            }

            if 'filters' in request.json and len(request.json['filters']) > 0:
                vector_opts['filter']['$and'].append({"$or":[]})
                for field, filter in request.json['filters'].items():
                    if filter['type'] == 'equals':
                        v_opt = {field: {'$eq': filter['val']}}
                        vector_opts['filter']['$and'][1]["$or"].append(v_opt)

            pipeline = [
                {
                    "$vectorSearch":vector_opts
                },
                {
                    "$unset":"embedding"
                },
                {
                    "$addFields":{
                        "score":{"$meta":"vectorSearchScore"}
                    }
                },
                {
                    "$group": {
                        "_id": "$parent_id",
                        "chunks": { "$push": "$$ROOT" },
                        "lang": { "$first": "$lang" },
                        "title": { "$first": "$title" },
                        "attribution": { "$first": "$attribution" },
                        "link": { "$first": "$link" },
                        "max": { "$max": "$score" },
                        "avg": { "$avg": "$score" },
                        "sum": { "$sum": "$score" },
                        "count": { "$count": {} }
                    }
                },
                {
                    "$project":{
                        "parent":"$_id",
                        "chunks":1,
                        "lang":1,
                        "attribution":1,
                        "link":1,
                        "title":1,
                        "score":{
                            "avg":"$avg",
                            "max":"$max",
                            "sum":"$sum",
                            "count":"$count"
                            }
                        }
                },
                {
                    "$sort":{
                        "score.max":-1
                    }
                }
            ]

            try:
                response = get_results(db['docs_chunks'], pipeline)
                return returnPrettyJson({"results": response, "query": pipeline})
            except Exception as error:
                return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500

@app.route('/fetch', methods=['POST'])
def fetch():
    try:
        pipeline = [
            {
                "$search": {
                    "index": "searchIndex",
                    "compound": {
                        "must": [
                            {
                                "text": {
                                    "query": request.json.get('query'),
                                    "path": {"wildcard": f"{request.json.get('field')}.*"}
                                }
                            }
                        ],
                        "filter": [
                            {
                                "equals": {
                                    "path": "_id",
                                    "value": request.json.get('id')
                                }
                            }
                        ]
                    },
                    "highlight": {
                        "path": [
                            {"wildcard": f"{request.json.get('field')}.*"}
                        ],
                        "maxNumPassages": 25
                    },
                }
            },
            {"$limit": 1}
        ]

        try:
            response = get_results(db['docs'], pipeline)
            return returnPrettyJson(response[0])
        except Exception as error:
            return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500

@app.route('/typeahead', methods=['POST'])
def typeahead():
    try:
        if 'q' not in request.args:
            return returnPrettyJson({"error": "Request missing 'q' param"}), 400
        else:
            query = request.args.get('q', default = "", type = str)

            search_opts = {
                "index": "searchIndex",
                "compound": {
                    "must": [
                        {
                            "autocomplete": {
                                "query": query,
                                "path": f"title.autocomplete"
                            }
                        }
                    ],
                    "filter": [
                        {
                            "in":{
                                "path":"namespace",
                                "value":[request.headers.get('User',''),'all']
                            }
                        }
                    ]
                },
            }

            if request.json.get('filters') and len(request.json.get('filters')) > 0:
                for field, filter in request.json.get('filters').items():
                    if filter["type"] == "equals":
                        opt = {
                            "equals": {
                                "path": field,
                                "value": filter["val"]
                            }
                        }
                        search_opts["compound"]["filter"].append(opt)

            pipeline = [
                {
                    "$search": search_opts
                },
                {"$limit": 4},
                {
                    "$project": {
                        "title": "$title.autocomplete",
                    }
                }
            ]

            try:
                response = get_results(db['docs'], pipeline)
                return returnPrettyJson({"results": response, "query": pipeline})
            except Exception as error:
                return returnPrettyJson({"error": str(error), "query": pipeline}), 405
    except Exception as e:
        return returnPrettyJson(e),500