import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const searchIndex = {
  name:"searchIndex",
  definition: {
    "mappings": {
      "dynamic": false,
      "fields": {
        "published":[
          {"type":"date"},
          {"type":"dateFacet"}
        ],
        "authors":[
          {"type":"string"},
          {"type":"token"},
          {"type":"stringFacet"}
        ],
        "lang":[
          {"type":"token"},
          {"type":"stringFacet"}
        ],
        "tags":[
          {"type":"string"},
          {"type":"token"},
          {"type":"stringFacet"}
        ],
        "summary": {
          "type": "document",
          "fields":{
            "en":{
              "type":"string",
              "analyzer":"lucene.english",
              "searchAnalyzer":"lucene.english"
            },
            "es":{
              "type":"string",
              "analyzer":"lucene.spanish",
              "searchAnalyzer":"lucene.spanish"
            },
            "fr":{
              "type":"string",
              "analyzer":"lucene.french",
              "searchAnalyzer":"lucene.french"
            }
          }
        },
        "content": {
          "type": "document",
          "fields":{
            "en":{
              "type":"string",
              "analyzer":"lucene.english",
              "searchAnalyzer":"lucene.english"
            },
            "es":{
              "type":"string",
              "analyzer":"lucene.spanish",
              "searchAnalyzer":"lucene.spanish"
            },
            "fr":{
              "type":"string",
              "analyzer":"lucene.french",
              "searchAnalyzer":"lucene.french"
            }
          }
        },
        "title": {
          "type": "document",
          "fields":{
            "en":[
              {"type":"string", "analyzer":"lucene.english","searchAnalyzer":"lucene.english"},
              {"type":"autocomplete"}
            ],
            "es":[
              {"type":"string", "analyzer":"lucene.spanish","searchAnalyzer":"lucene.spanish"},
              {"type":"autocomplete"}
            ],
            "fr":[
              {"type":"string", "analyzer":"lucene.french","searchAnalyzer":"lucene.french"},
              {"type":"autocomplete"}
            ]
          }
        }
      }
    }
  }
  
}

// const vectorIndex = {
//   name: "vectorIndex",
//   definition: {
//     "type": "vectorSearch",
//     "fields": [
//       {
//         "type": "vector",
//         "path": "plot_embedding",
//         "numDimensions": 1536,
//         "similarity": "cosine"
//       }
//     ]
//   }
// }

console.log("Connection string: ", process.env.MDBCONNSTR);
console.log("Database: ", process.env.MDB_DB);
console.log("Collection: ", "docs");

try{
  const client = new MongoClient(process.env.MDBCONNSTR);
  try{
      await client.connect();
      try{
        const db = client.db(process.env.MDB_DB);
        const collection = db.collection("docs");
        await collection.createSearchIndex(searchIndex);
        // await collection.createSearchIndex(vectorIndex);
        console.log(collection.listSearchIndexes());
      }catch(error){
        console.log(`Connection failed ${error}`);
        throw error;
      }finally{
        client.close();
      }
  }catch(error){
      throw error;
  }
}catch(error){
  console.log(`Connection failed ${error}`);
  throw error;
}
