import axios from 'axios';
import Header from '../components/head';
import SearchResult from '../components/result'
import {SearchInput} from '@leafygreen-ui/search-input';
import { useState, useEffect} from 'react';
import { H1,H2, H3, Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import Pagination from '@leafygreen-ui/pagination';
import schema from '../config.mjs'
import { Option, OptionGroup, Select, Size } from '@leafygreen-ui/select';
import Facets from '../components/facets';
import Filters from '../components/filters';
import { Spinner } from '@leafygreen-ui/loading-indicator';

export default function Home(){
  const [query, setQuery] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [lang, setLang] = useState('all');
  const [filters, setFilters] = useState({});
  const [response, setResponse] = useState({});
  const [meta, setMeta] = useState({hits:0});
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    if(lang != 'all'){
      setFilters(filters => ({...filters, 'lang':{val:lang,type:'equals'}}));
    }else{
      let copiedFilters = {...filters}
      delete copiedFilters['lang']
      setFilters(filters => ({...copiedFilters}));
    }
  },[lang]);

  useEffect(() => {
    setPage(1);
    if(query && query != ""){
      setLoading(true);
      getInstantResults({query:query,pageSize:pageSize,filters:filters})
        .then(resp => {
          setLoading(false);
          setResponse(response => ({...resp.data}));
        })
        .catch(error => console.log(error));

      getMeta({query:query,filters:filters})
        .then(resp => {
          setLoading(false);
          setMeta(meta => ({...resp.data}));
        })
        .catch(error => console.log(error));
    }
  },[filters]);

  const handleSearch = () => {
    if(query && query != ""){
      setLoading(true);
      getInstantResults({query:query,pageSize:pageSize,filters:filters})
      .then(resp => {
        setLoading(false);
        setResponse(response => ({...resp.data}));
      })
      .catch(error => console.log(error));

      getMeta({query:query,filters:filters})
      .then(resp => setMeta(meta => ({...resp.data})))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleVectorSearch = () => {
    if(query && query != ""){
      vectorSearch(query)
      .then(resp => setResponse(response => ({...resp.data})))
      .catch(error => console.log(error));
    }else{
      setQuery(null);
    }
  }

  const handleQueryChange = (event) => {
    setResponse({results:null,query:event.target.value,hits:0,facets:null});
    setQuery(event.target.value);
    setLoading(true);
    setPage(1);
    getInstantResults({query:event.target.value,pageSize:pageSize,filters:filters})
    .then(resp => {
      setLoading(false);
      setResponse(response => ({...resp.data}));
    })
    .catch(error => console.log(error));

    getMeta({query:event.target.value,filters:filters})
      .then(resp => setMeta(meta => ({...resp.data})))
      .catch(error => console.log(error));
  };

  const nextPage = () => {
    setPage(page+1);
    setLoading(true);
    getInstantResults({query:query,after:response.results[response.results.length-1].paginationToken,pageSize:pageSize,filters:filters})
    .then(resp => {
      setLoading(false);
      setResponse(response => ({...resp.data}));
    })
    .catch(error => console.log(error));
  }

  const prevPage = () => {
    setPage(page-1);
    setLoading(true);
    getInstantResults({query:query,before:response.results[0].paginationToken,pageSize:pageSize,filters:filters})
    .then(resp => {
      setLoading(false);
      setResponse(resp.data);
    })
    .catch(error => console.log(error));
  }

  const handleLanguageChange = (lang) => {
    setLang(lang);
  };

  const handleAddFilter = (filter,val) => {
    setFilters(filters => ({...filters, [filter]:val}));
  };

  const handleRemoveFilter = (field) => {
    console.log(field)
    let copiedFilters = filters;
    delete copiedFilters[field]
    setFilters(filters => ({...copiedFilters}));
  };

  return (
    <>
    <Header/>
    <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"",alignItems:"start", paddingLeft:"16px"}}>
      <div><H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1><H3 style={{textAlign:"center"}}>News Search</H3></div>
      <div style={{paddingTop:"30px",paddingRight:"100px",justifyContent:"right", display:"grid",gridTemplateColumns:"90% 70px",gap:"10px",alignItems:"middle", paddingLeft:"16px"}}>
        <div><SearchInput onChange={handleQueryChange} aria-label="some label" style={{marginBottom:"20px"}}></SearchInput></div>
        <div><Button onClick={()=>handleSearch()} variant="primary">Search</Button></div>
        {/* <div>
          <Select 
            label="Languages"
            placeholder="All"
            name="Languages"
            size="xsmall"
            defaultValue="all"
            onChange={handleLanguageChange}
          >
            <Option value="en">English</Option>
            <Option value="fr">French</Option>
            <Option value="es">Spanish</Option>
          </Select>
        </div> */}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
      <div style={{paddingTop:"35px"}}>
      {meta?.facets
        ? 
        <Facets facets={meta.facets} onFilterChange={handleAddFilter}/>
        : <></>
      }
      </div>
      <div>
        {
          loading
          ?
          <Spinner variant="large" description="Loading…"/>
          :
          meta.hits > 0
            ?
            <div style={{maxWidth:"95%"}}>
              {Object.keys(filters).length > 0 ? <Filters filters={filters} handleRemoveFilter={handleRemoveFilter}/> :<></>}
              <Pagination currentPage={page}
                itemsPerPage={4}
                itemsPerPageOptions={[4]}
                numTotalItems={meta.hits}
                onBackArrowClick={prevPage}
                onForwardArrowClick={nextPage}
              />
              {response.results.map(r => (
                <SearchResult key={r._id} r={r} schema={schema}></SearchResult>
              ))}
              <Pagination currentPage={page}
                itemsPerPage={4}
                itemsPerPageOptions={[4]}
                numTotalItems={meta.hits}
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

async function getInstantResults({query=query,before=null,after=null,pageSize=null,filters=null}={}) {
  const token = before ? before : after ? after : ''
  const page = before ? 'prev' : after ? 'next' : ''
  const params = `q=${query}&page=${page}&pageToken=${token}`
  const body = {
    filters:filters
  }
  return new Promise((resolve) => {
      axios.post(`api/search?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}

async function getMeta({query=query,filters=null}={}) {
  const params = `q=${query}`
  const body = {
    filters:filters
  }
  return new Promise((resolve) => {
      axios.post(`api/searchMeta?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
