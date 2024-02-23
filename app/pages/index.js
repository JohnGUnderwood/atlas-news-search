import axios from 'axios';
import Header from '../components/head';
import SearchResult from '../components/result'
import {SearchInput} from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import { H1,H2, H3, Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Button from '@leafygreen-ui/button';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import Pagination from '@leafygreen-ui/pagination';
import schema from '../config.mjs'

export default function Home(){
  const [query, setQuery] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [response, setResponse] = useState({results:null,query:null,hits:0,facets:null});

  const handleSearch = () => {
    if(query && query != ""){
      getInstantResults({query:query,pageSize:pageSize})
      .then(resp => setResponse(resp.data))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleVectorSearch = () => {
    if(query && query != ""){
      vectorSearch(query)
      .then(resp => setResponse(resp.data))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleQueryChange = (event) => {
    setResponse({results:null,query:event.target.value,hits:0,facets:null});
    setQuery(event.target.value);
    getInstantResults({query:event.target.value,pageSize:pageSize})
    .then(resp => setResponse(resp.data))
    .catch(error => console.log(error));
  };

  const nextPage = () => {
    setPage(page+1);
    getInstantResults({query:query,after:response.results[response.results.length-1].paginationToken,pageSize:pageSize})
    .then(resp => setResponse(resp.data))
    .catch(error => console.log(error));
  }

  const prevPage = () => {
    setPage(page-1);
    getInstantResults({query:query,before:response.results[0].paginationToken,pageSize:pageSize})
    .then(resp => setResponse(resp.data))
    .catch(error => console.log(error));
  }

  const changeItemsPerPage = (event) => {
    setPageSize(event.target.value);
  }
  

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
      {/* {response?.facets && response.facets.facet
        ? 
        <Card>
          <Subtitle key={`${schema.facetField}`}>{schema.facetField}</Subtitle>
              {response.facets.facet[`${schema.facetField}`].buckets.map(bucket => (
                  <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
              ))}
        </Card>
        : <></>
      } */}
      </div>
      <div>
        {
          response.hits > 0
          ?
          <div style={{maxWidth:"95%"}}>
            {response.results.map(r => (
              <SearchResult r={r} schema={schema}></SearchResult>
            ))}
            <Pagination currentPage={page}
              itemsPerPage={4}
              itemsPerPageOptions={[4,10,25]}
              onItemsPerPageOptionChange={changeItemsPerPage}
              numTotalItems={response.hits}
              onBackArrowClick={prevPage}
              onForwardArrowClick={nextPage}
            />
          </div>
          :
          <></>
        }
      </div>
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

async function getInstantResults({query=query,before=null,after=null,pageSize=null}={}) {
  const token = before ? before : after ? after : ''
  const page = before ? 'prev' : after ? 'next' : ''
  return new Promise((resolve) => {
      axios.get(`api/search?q=${query}&page=${page}&pageToken=${token}`)
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
