import axios from 'axios';
import Header from '../components/head';
import { Facets, Filters, SearchResult, ChunksResult }from '../components/search'
import { useState, useEffect} from 'react';
import Pagination from '@leafygreen-ui/pagination';
import { Option, OptionGroup, Select, Size } from '@leafygreen-ui/select';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import SearchBanner from '../components/searchBanner/SearchBanner';
import ScalarSlider from '../components/scalarSlide';

export default function Search(){
  const [query, setQuery] = useState({terms:'',method:'fts',filters:{},scalar:{fts:0.5,vector:0.5}});
  const [page, setPage] = useState(1);
  const [response, setResponse] = useState({});
  const [meta, setMeta] = useState({hits:0});
  const [loading, setLoading] = useState(null);
  const [instantResults, setInstantResults] = useState(null);
  const [preview, setPreview] = useState({id:'',show:false});

  const schema = {
    descriptionField : "summary",
    contentField : "content",
    titleField : "title",
    imageField : "media_thumbnail",
    vectorField : "embedding",
    facetField : "tags",
  }

  useEffect(() => {
    handleSearch();
  },[query.filters,query.method,query.scalar]);

  useEffect(() => {
    if(query.terms && query.terms != ''){
      getTypeahead(query)
      .then(resp => {
        setInstantResults(resp.data);
      })
    }else if(query.terms == ''){
      setInstantResults(null);
      setResponse({});
      setMeta({hits:0});
    }
  },[query.terms]);

  const handleSearch = () => {
    if(query && query.terms && query.terms != ""){
      setLoading(true);
      getSearchResults(query)
      .then(resp => {
        setLoading(false);
        setResponse(resp.data);
      })
      .catch(error => console.log(error));

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

  const handleInstantClick = (term) => {
    console.log("handleInstantClick",term)
    setQuery(prevQuery => ({...prevQuery,terms:term}));
    handleSearch();
  }

  const handleSliderChange = (value) => {
    console.log("handleSliderChange",value);
    value = parseFloat(value);
    setQuery(prevQuery => ({
      ...prevQuery,
      scalar: {
        ...prevQuery.scalar,
        fts: parseFloat((1 - value).toFixed(1)),
        vector: parseFloat(value.toFixed(1))
      }
  }));
   
  }

  return (
    <>
    <Header/>
    <SearchBanner appName="News Search"
      query={query.terms}
      handleQueryChange={handleQueryChange}
      handleSearch={handleSearch}
      instantResults={instantResults}
      instantField={'title'}
      instantClick={handleInstantClick}>
      <Select 
        label="Search Method"
        name="Methods"
        size="xsmall"
        defaultValue="fts"
        onChange={handleMethodChange}
      >
        <Option value="fts">Fulltext search</Option>
        <Option value="vector">Vector</Option>
        <Option value="rsf">Relative Score Fusion</Option>
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
                  <SearchResult query={query.terms} key={r._id} r={r} schema={schema} setPreview={setPreview}></SearchResult>
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
    :query.method == "vector" || query.method == "rsf" ?
      <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
        <div style={{paddingTop:"35px"}}>
        </div>
        <div>
          {query.method === "rsf" ? <ScalarSlider query={query} handleSliderChange={handleSliderChange}/> : <></>}
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

async function getSearchResults({method=method,terms=terms,page=null,token=null,pageSize=null,filters=null,scalar=null}={}) {
  const params = `q=${terms}`
  const body = {
    filters:filters,
    page:page,
    pageToken:token,
    fts_scalar:scalar.fts,
    vector_scalar:scalar.vector
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