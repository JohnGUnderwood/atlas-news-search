from packages import MongoDBConnection,Embeddings,languages
from pymongo.errors import CollectionInvalid,OperationFailure
from pymongo.operations import SearchIndexModel
from dotenv import load_dotenv
from os import getenv

load_dotenv()

connection=MongoDBConnection()
db=connection.get_database()
embedder =  Embeddings()

feeds_search_index = SearchIndexModel(
    name="default",
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "name": {
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
                        },
                        "namespace":{
                            "type":"token"
                        }
                    }
                }
            }
        }
    }
)

docs_search_index = SearchIndexModel(
    name="searchIndex",
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "namespace":{
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
                "summary": {
                    "type": "document",
                    "fields": {}
                },
                "content": {
                    "type": "document",
                    "fields": {}
                },
                "title": {
                    "type": "document",
                    "fields": {
                        "autocomplete":[
                            {
                                "type": "autocomplete"
                            }
                        ]
                    }
                }
            }
        }
        }
)

# Dynamically add language definitions to the search index
for field in 'summary','content','title':
    for lang in languages:
        docs_search_index.document['definition']['mappings']['fields'][field]['fields'][lang['code']] = {
            "type": "string",
            "analyzer": lang['lucene_analyzer'],
            "searchAnalyzer": lang['lucene_analyzer']
        }

docs_chunks_search_index = SearchIndexModel(
    name="searchIndex",
    definition={
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
                "namespace":{
                    "type":"token"
                },
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
)

docs_chunks_vector_index = SearchIndexModel(
        name="vectorIndex",
        type="vectorSearch",
        definition={
            "fields":[
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": embedder.get_dimensions(),
                    "similarity": "cosine"
                },
                {
                    "type":"filter",
                    "path":"published",
                },
                {
                    "type":"filter",
                    "path":"namespace",
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
    )

collections = [
    {'name':"queue",'indexes':None},
    {'name':"logs",'indexes':None},
    {'name':"feeds",'indexes':[feeds_search_index]},
    {'name':"docs",'indexes':[docs_search_index]},
    {'name':'docs_chunks','indexes':[docs_chunks_search_index,docs_chunks_vector_index]}]

print("Creating collections and indexes on database: ",db.name)
for c in collections:
    try:
        db.create_collection(c['name'],check_exists=True)
    except CollectionInvalid as e:
        print("The {} collection already exists:".format(c['name']), e)
        pass

for c in collections:
    if c['indexes'] is None:
        continue
    else:
        print("Creating search indexes for {}".format(c['name']))
        for index in c['indexes']:
            print("\tCreating index {}".format(index.document.get('name')))
            try:
                db.get_collection(c['name']).create_search_index(model=index)
            except OperationFailure as e:
                if 'codeName' in e.details and e.details['codeName'] == 'IndexAlreadyExists':
                    print("\t\tIndex already exists. Updating...")
                    db.get_collection(c['name']).update_search_index(index.document.get('name'),index.document.get('definition'))
                    pass
                else:
                    print("\t\tError updating index:", e)
                    raise e