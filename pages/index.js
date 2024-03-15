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

export default function Home(){
  const [query, setQuery] = useState({terms:'',method:'fts',filters:{}});
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState({});
  const [meta, setMeta] = useState({hits:0});
  const [loading, setLoading] = useState(null);
  const [instantResults, setInstantResults] = useState(null);

  useEffect(() => {
    console.log("query.filters or query,method changed");
    console.log("query.method",query.method);
    handleSearch();
  },[query.filters,query.method]);

  useEffect(() => {
    if(query.terms && query.terms != ''){
      getTypeahead(query)
      .then(resp => {
        setInstantResults(resp.data);
      })
    }
  },[query.terms]);

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
    setQuery(prevQuery => ({...prevQuery,terms:event.target.value}));
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
    setResponse({});
    setQuery(prevQuery => ({...prevQuery,method:m}));
  };

  const handleAddFilter = (filter,val) => {
    let copiedFilters = {...query.filters};
    copiedFilters[filter] = val;
    setQuery(prevQuery => ({...prevQuery, filters: copiedFilters}));
  };

  const handleRemoveFilter = (field) => {
    let copiedFilters = {...query.filters};
    delete copiedFilters[field]
    setQuery(prevQuery => ({...prevQuery, filters: copiedFilters}));
  }

  return (
    <>
    <Header/>
    <SearchBanner appName="News Search"
      query={query.terms}
      handleQueryChange={handleQueryChange}
      handleSearch={handleSearch}
      instantResults={instantResults}
      instantField={`${schema.titleField}`}>
      <Select 
        label="Search Method"
        name="Methods"
        size="xsmall"
        defaultValue="fts"
        onChange={handleMethodChange}
      >
        <Option value="fts">Fulltext search</Option>
        <Option value="vector">Vector</Option>
      </Select>
    </SearchBanner>
    {query.method == "fts"?
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
                {query.filters? Object.keys(query.filters).length > 0 ? <Filters filters={query.filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
                <Pagination currentPage={page}
                  itemsPerPage={4}
                  itemsPerPageOptions={[4]}
                  numTotalItems={meta.hits}
                  onBackArrowClick={prevPage}
                  onForwardArrowClick={nextPage}
                />
                {response.results? response.results.map(r => (
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
    :query.method == "vector" ?
      <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
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
                {query.filters? Object.keys(query.filters).length > 0 ? <Filters filters={query.filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
                {response.results? response.results.map(r => (
                  <ChunksResult key={r._id} r={r} schema={schema}></ChunksResult>
                )):<></>}
              </div>
              :
              <></>
          }
        </div>
      </div> 
    :<></>}
    
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
