import axios from 'axios';
import Header from '../components/head';
import SearchResult from '../components/result'
import {SearchInput} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import { H1,H2, H3, Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";

// schema variables
const schema = {
  descriptionField : "summary",
  contentField : "content",
  titleField : "title",
  imageField : "media_thumbnail",
  vectorField : "plot_embedding",
  facetField : "tags",
}

export default function Home(){
  const [query, setQuery] = useState(null);
  const [instantResults, setInstantResults] = useState(null);

  const handleSearch = () => {
    if(query && query != ""){
      getInstantResults(query)
      .then(resp => setInstantResults(resp.data.results))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleVectorSearch = () => {
    if(query && query != ""){
      vectorSearch(query)
      .then(resp => setInstantResults(resp.data.results))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleQueryChange = (event) => {
    setInstantResults(null);
    setQuery(event.target.value);
    getInstantResults(event.target.value)
    .then(resp => setInstantResults(resp.data.results))
    .catch(error => console.log(error));
  };

  return (
    <>
    <Header/>
    <div style={{display:"grid",gridTemplateColumns:"150px 75% 60px",gap:"10px",alignItems:"start", paddingLeft:"16px"}}>
      <div><H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1><H3 style={{textAlign:"center"}}>News Search</H3></div>
      <div style={{paddingTop:"30px"}}><SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
      <div style={{paddingTop:"30px"}}><Button onClick={()=>handleSearch()} variant="primary">Search</Button></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"10% 80% 10%",gap:"0px",alignItems:"start"}}>
      <div style={{paddingTop:"225px"}}>
      {instantResults && instantResults[0] && instantResults[0].facets && instantResults[0].facets.facet
        ? 
        <Card>
          <Subtitle key={`${schema.facetField}`}>{schema.facetField}</Subtitle>
              {instantResults[0].facets.facet[`${schema.facetField}`].buckets.map(bucket => (
                  <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
              ))}
        </Card>
        : <></>
      }
      </div>
      <div>
        {
          instantResults && instantResults.length > 0
          ?
          <div style={{maxWidth:"95%"}}>
            {instantResults.map(r => (
              <SearchResult r={r} schema={schema}></SearchResult>
            ))}
          </div>
          :
          <></>
        }
      </div>
      <div></div>
    </div>
    </>
  )
}

async function vectorSearch(query) {

  const embeddingResp = await axios.get('api/embed?terms='+query);

  const pipeline = [
    {
      $vectorSearch:{
        index: "vectorIndex",
        queryVector: embeddingResp.data,
        path:`${schema.vectorField}`,
        numCandidates:50,
        limit:10
      }
    },
    {
      $project:{
          title:`$${schema.titleField}`,
          image:`$${schema.imageField}`,
          description:`$${schema.descriptionField}`,
          score:{$meta:"searchScore"},
          lang:1,
          attribution:1,
      }
    }
  ]
  return new Promise((resolve) => {
    axios.post(`api/search`,
        { 
          pipeline : pipeline
        },
    ).then(response => resolve(response))
    .catch((error) => {
        console.log(error)
        resolve(error.response.data);
    })
  });
}

async function getInstantResults(query) {
  const pipeline = [
      // {
      //   $match:{ $expr : { $eq: [ '$_id' , { $toObjectId: query } ] } }
      // },
      // {
      //   $match: { [`${titleField}`] : query }
      // },
      {
        $search:{
          index:"searchIndex",
          text:{
                query:query,
                path: [
                  { "wildcard": `${schema.titleField}.*` },
                  { "wildcard": `${schema.descriptionField}.*` },
                  { "wildcard": `${schema.contentField}.*` }
                ],
            },
          // autocomplete:{
          //       query:query,
          //       path:`${titleField}`
          //   },
          highlight:{
            path:[
              {wildcard:`${schema.descriptionField}.*`},
              {wildcard:`${schema.contentField}.*`}
            ]
          },
          // compound:{
          //   should:[
          //     {
          //       text:{
          //         query:query,
          //         path:{wildcard:"*"},
          //         fuzzy:{
          //           maxEdits:1,
          //           maxExpansions:10
          //         }
          //       }
          //     },
          //     {
          //       autocomplete:{
          //           query:query,
          //           path:`${titleField}`
          //       }
          //     }
          //   ]
          // },
          // facet:{
          //   operator:{
          //     compound:{
          //       should:[
          //         {
          //           text:{
          //             query:query,
          //             path:{wildcard:"*"},
          //             // fuzzy:{
          //             //   maxEdits:1,
          //             //   maxExpansions:10
          //             // }
          //           }
          //         },
          //         {
          //           autocomplete:{
          //               query:query,
          //               path:`${titleField}`
          //           }
          //         }
          //       ]
          //     }
          //   },
          //   facets:{
          //     genres:{
          //       type:"string",
          //       path:`${facetField}`
          //     }
          //   }
          // }
        },
      },
      {
          $limit:10
      },
      {
          $project:{
            title:`$${schema.titleField}`,
            image:`$${schema.imageField}`,
            description:`$${schema.descriptionField}`,
            highlights: { $meta: "searchHighlights" },
            score:{$meta:"searchScore"},
            // facets:"$$SEARCH_META",
            lang:1
          }
      }
  ]
  return new Promise((resolve) => {
      axios.post(`api/search`,
          { 
            pipeline : pipeline
          },
      ).then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
