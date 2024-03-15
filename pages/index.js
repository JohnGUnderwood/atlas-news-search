import axios from 'axios';
import Header from '../components/head';
import { SearchResult, ChunksResult }from '../components/results'
import { useState, useEffect} from 'react';
import Pagination from '@leafygreen-ui/pagination';
import { schema } from '../config.mjs'
import { Option, OptionGroup, Select, Size } from '@leafygreen-ui/select';
import Facets from '../components/facets';
import Filters from '../components/filters';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import SearchBanner from '../components/searchBanner/SearchBanner';
import { Tabs, Tab } from '@leafygreen-ui/tabs';

export default function Home(){
  const [query, setQuery] = useState({terms:'',method:'fts'});
  const [page, setPage] = useState(1);
  // const [pageSize, setPageSize] = useState(4);
  const [filters, setFilters] = useState({});
  const [response, setResponse] = useState({});
  const [meta, setMeta] = useState({hits:0});
  const [loading, setLoading] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [instantResults, setInstantResults] = useState(null);

  // useEffect(() => {
  //   if(lang != 'all'){
  //     setQuery({...query, filters:{...query.filters, 'lang':{val:lang,type:'equals'}}})
  //   }else{
  //     let copiedFilters = query.filters
  //     delete copiedFilters['lang']
  //     setQuery({...query,filters:copiedFilters});
  //   }
  // },[lang]);

  useEffect(() => {
    setPage(1);
    if(query && query.terms && query.terms != ""){
      setLoading(true);
      // getSearchResults({query:query,pageSize:pageSize,filters:filters})
      getSearchResults(query)
        .then(resp => {
          setLoading(false);
          setResponse(resp.data);
        })
        .catch(error => console.log(error));
      
      getMeta(query)
      // getMeta({query:query,filters:filters})
        .then(resp => {
          setLoading(false);
          setMeta(resp.data);
        })
        .catch(error => console.log(error));
    }
  },[filters]);

  const handleSearch = () => {
    if(query && query.terms && query.terms != ""){
      setLoading(true);
      // getSearchResults({query:query,pageSize:pageSize,filters:filters})
      getSearchResults(query)
      .then(resp => {
        setLoading(false);
        setResponse(resp.data);
      })
      .catch(error => console.log(error));

      // getMeta({query:query,filters:filters})
      getMeta(query)
      .then(resp => setMeta(resp.data))
      .catch(error => console.log(error));
    }
  }

  const handleQueryChange = (event) => {
    setQuery({...query,terms:event.target.value});
    getTypeahead(query)
    .then(resp => {
      setInstantResults(resp.data);
    })
  };

  const nextPage = () => {
    setPage(page+1);
    setLoading(true);
    getSearchResults({...query,page:'next',token:response.results[response.results.length-1].paginationToken})
    .then(resp => {
      setLoading(false);
      setResponse(resp.data);
    })
    .catch(error => console.log(error));
  }

  const prevPage = () => {
    setPage(page-1);
    setLoading(true);
    getSearchResults({...query,query,page:'prev',token:response.results[0].paginationToken})
    .then(resp => {
      setLoading(false);
      setResponse(resp.data);
    })
    .catch(error => console.log(error));
  }

  const handleMethodChange = (m) => {
    setQuery({...query,method:m});
  };

  const handleAddFilter = (filter,val) => {
    setQuery({...query,filters:{...query.filters, [filter]:val}});
  };

  const handleRemoveFilter = (field) => {
    console.log(field)
    let copiedFilters = query.filters;
    delete copiedFilters[field]
    setQuery({...query,filters:copiedFilters});
  };

  return (
    <>
    <Header/>
    <SearchBanner appName="News Search"
      query={query.terms}
      handleQueryChange={handleQueryChange}
      handleSearch={handleSearch}
      instantResults={instantResults}
      instantField={`${schema.titleField}`}/>
    <div>
        <Select 
          label="Methods"
          placeholder="Fulltext Search"
          name="Methods"
          size="xsmall"
          defaultValue="fts"
          onChange={handleMethodChange}
        >
          <Option value="vector">Vector</Option>
        </Select>
      </div> 
    <Tabs style={{marginTop:"15px"}} setSelected={setSelectedTab} selected={selectedTab}>
      <Tab name="Fulltext Search">
        {query.method == "fts"? <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
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
                  {query.filters? Object.keys(query.filters).length > 0 ? <Filters filters={query.filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
                  <Pagination currentPage={page}
                    itemsPerPage={4}
                    itemsPerPageOptions={[4]}
                    numTotalItems={meta.hits}
                    onBackArrowClick={prevPage}
                    onForwardArrowClick={nextPage}
                  />
                  {response? response.results.map(r => (
                    <SearchResult key={r._id} r={r} schema={schema}></SearchResult>
                  )):<></>}
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
        :<></>}
      </Tab>
      <Tab name="FTS with Cosine Re-ranking">
        placeholder
      </Tab>
      <Tab name="Vector Search">
        {query.method == "vector" ?<div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
          <div style={{paddingTop:"35px"}}>
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
                  {query.filters? Object.keys(query.filters).length > 0 ? <Filters filters={filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
                  {response? response.results.map(r => (
                    <ChunksResult key={r._id} r={r} schema={schema}></ChunksResult>
                  )):<></>}
                </div>
                :
                <></>
            }
          </div>
        </div> 
        :<></>}
      </Tab>
      <Tab name="Relative Score Fusion">
        placeholder      
      </Tab>
      <Tab name="Reciprocal Rank Fusion">
        placeholder      
      </Tab>
    </Tabs>
    
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

async function getSearchResults({method=method,terms=terms,page=null,token=null,pageSize=null,filters=null}={}) {
  const params = `q=${terms}`
  const body = {
    filters:filters,
    page:page,
    pageToken:token
  }
  return new Promise((resolve) => {
      axios.post(`api/search/${method}?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}

async function getMeta({terms=terms,filters=null}={}) {
  const params = `q=${terms}`
  const body = {
    filters:filters
  }
  return new Promise((resolve) => {
      axios.post(`api/search/meta?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}

async function getTypeahead({terms=terms,filters=null}={}) {
  const params = `q=${terms}`
  const body = {
    filters:filters
  }
  return new Promise((resolve) => {
      axios.post(`api/typeahead?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}

async function getVectorSearchResults({terms=terms,filters=null}={}) {
  const params = `q=${terms}`
  const body = {
    filters:filters,
  }
  return new Promise((resolve) => {
      axios.post(`api/search/vector?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
