from packages import MongoDBConnection
from pymongo.errors import CollectionInvalid,OperationFailure
from dotenv import load_dotenv
from os import getenv

load_dotenv()

connection=MongoDBConnection()
db=connection.connect()

feeds_search_index = {
    "name":"default",
    "definition":{
        "mappings": {
            "dynamic": False,
            "fields": {
                "_id": {
                    "type": "autocomplete"
                },
                "config":{
                    "type": "document",
                    "fields": {
                        "attribution":{
                            "type": "autocomplete"
                        },
                        'url':{
                            "type": "autocomplete",
                            "tokenization":"nGram",
                            "minGrams":3,
                            "maxGrams":20
                        }
                    }
                }
            }
        }
    }
}

docs_search_index = {
    "name":"searchIndex",
    "definition":{
        "mappings": {
            "dynamic": False,
            "fields": {
                "_id":{
                    "type":"token"
                },
                "published": [
                    {
                    "type": "date"
                    },
                    {
                    "type": "dateFacet"
                    }
                ],
                "attribution": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "authors": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "lang": [
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "tags": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "nasdaq_tickers": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "summary": {
                    "type": "document",
                    "fields": {
                    "en": {
                        "type": "string",
                        "analyzer": "lucene.english",
                        "searchAnalyzer": "lucene.english"
                    },
                    "es": {
                        "type": "string",
                        "analyzer": "lucene.spanish",
                        "searchAnalyzer": "lucene.spanish"
                    },
                    "fr": {
                        "type": "string",
                        "analyzer": "lucene.french",
                        "searchAnalyzer": "lucene.french"
                    }
                    }
                },
                "content": {
                    "type": "document",
                    "fields": {
                    "en": {
                        "type": "string",
                        "analyzer": "lucene.english",
                        "searchAnalyzer": "lucene.english"
                    },
                    "es": {
                        "type": "string",
                        "analyzer": "lucene.spanish",
                        "searchAnalyzer": "lucene.spanish"
                    },
                    "fr": {
                        "type": "string",
                        "analyzer": "lucene.french",
                        "searchAnalyzer": "lucene.french"
                    }
                    }
                },
                "title": {
                    "type": "document",
                    "fields": {
                    "en": [
                        {
                        "type": "string",
                        "analyzer": "lucene.english",
                        "searchAnalyzer": "lucene.english"
                        },
                        {
                        "type": "autocomplete"
                        }
                    ],
                    "es": [
                        {
                        "type": "string",
                        "analyzer": "lucene.spanish",
                        "searchAnalyzer": "lucene.spanish"
                        },
                        {
                        "type": "autocomplete"
                        }
                    ],
                    "fr": [
                        {
                        "type": "string",
                        "analyzer": "lucene.french",
                        "searchAnalyzer": "lucene.french"
                        },
                        {
                        "type": "autocomplete"
                        }
                    ]
                    }
                }
            }
        }
        }
}

docs_chunks_search_index = {
    "name":"searchIndex",
    "definition":{
        "mappings": {
            "dynamic": False,
            "fields": {
                "published": [
                    {
                    "type": "date"
                    },
                    {
                    "type": "dateFacet"
                    }
                ],
                "authors": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "tags": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "nasdaq_tickers": [
                    {
                    "type": "string"
                    },
                    {
                    "type": "token"
                    },
                    {
                    "type": "stringFacet"
                    }
                ],
                "content": {
                    "type":"string"
                }
            
            }
        }
        }
}

docs_chunks_vector_index = {
    "name":"vectorIndex",
    "type":"vectorSearch",
    "definition":{
        "fields":[
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": int(getenv("EMBEDDING_DIMENSIONS",1536)),
                "similarity": "cosine"
            },
            {
                "type":"filter",
                "path":"published",
            },
            {
                "type":"filter",
                "path":"type",
            },
            {
                "type":"filter",
                "path":"lang",
            }
            ,
            {
                "type":"filter",
                "path":"nasdaq_tickers",
            }
        ]
    }
}

collections = [
    {'n':"queue",'m':None},
    {'n':"logs",'m':None},
    {'n':"feeds",'m':feeds_search_index},
    {'n':"docs",'m':docs_search_index},
    {'n':'docs_chunks','m':docs_chunks_search_index,'v':docs_chunks_vector_index}]

print("Creating collections and indexes on database: ",db.name)
for c in collections:
    try:
        db.create_collection(c['n'],check_exists=True)
    except CollectionInvalid as e:
        print("The {} collection already exists:".format(c['n']), e)
        pass

for c in collections:
    if c['m'] is None:
        continue
    else:
        print("Creating search index {} for {}".format(c['m']['name'],c['n']))
        try:
            db.get_collection(c['n']).create_search_index(model=c['m'])
        except OperationFailure as e:
            if 'codeName' in e.details and e.details['codeName'] == 'IndexAlreadyExists':
                print("\tIndex already exists")
                pass
            else:
                print("\tError creating index:", e)
                raise e
        if 'v' in c:
            print("Creating vector index {} for {}".format(c['v']['name'],c['n']))
            try:
                db.command("createSearchIndexes",c['n'],indexes=[c['v']])
            except OperationFailure as e:
                if 'codeName' in e.details and e.details['codeName'] == 'IndexAlreadyExists':
                    print("\tIndex already exists")
                    pass
                else:
                    print("\tError creating index:", e)
                    raise e
connection.close()