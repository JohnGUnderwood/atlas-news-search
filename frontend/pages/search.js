import Header from '../components/head';
import { Facets, Filters, SearchResult, ChunksResult }from '../components/search'
import { useState, useEffect} from 'react';
import Pagination from '@leafygreen-ui/pagination';
import { Option, OptionGroup, Select, Size } from '@leafygreen-ui/select';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import SearchBanner from '../components/searchBanner/SearchBanner';
import { useApi } from '../components/useApi';

export default function SearchPage(context){
  const [state, setState] = useState({
    query: {terms:'',method:'fts',filters:{},paginationToken: null},
    page: 1,
    response: {},
    meta: {hits:0},
    loading: null,
    instantResults: null,
    preview: {id:'',show:false},
  });
  const schema = {
    descriptionField : "summary",
    contentField : "content",
    titleField : "title",
    imageField : "media_thumbnail",
    vectorField : "embedding",
    facetField : "tags",
  }
  const api = useApi();

  
  useEffect(() => {
    runSearch();
  },[state.query.filters,state.query.method,state.query.page]);
  
  useEffect(() => {
    if(state.query.terms && state.query.terms != ''){
      api.post(`typeahead?`,state.query,{q:state.query.terms})
      .then(resp => {
        setState(prevState => ({...prevState, instantResults: resp.data}));
      })
      .catch(error => {
        console.log(error);
        setState(prevState => ({...prevState, loading: false, response: error.response.data}));
      });
    }else if(state.query.terms == ''){
      setState(prevState => ({
        ...prevState,
        page:1,
        instantResults: null,
        response: {},
        meta: {hits:0}
      }));
    }
  },[state.query.terms]);
  
  const setPreview = (id) => {
    setState(prevState => ({...prevState, preview: {id:id,show:!prevState.preview.show}}));
  }

  const runSearch = () => {
    if(state.query && state.query.terms && state.query.terms != ""){
      setState(prevState => ({...prevState, loading: true}));
      api.post(`search/${state.query.method}?`,state.query,{q:state.query.terms})
      .then(resp => {
        setState(prevState => ({...prevState, loading: false, response: resp.data}));
      })
      .catch(error => {
        console.log(error);
        setState(prevState => ({...prevState, loading: false, response: error.response.data}));
      });
      
      api.post(`search/meta?`,state.query,{q:state.query.terms})
      .then(resp => setState(prevState => ({...prevState, meta: resp.data})))
      .catch(error => {
        console.log(error);
        setState(prevState => ({...prevState, loading: false, response: error.response.data}));
      });
    }
  }
  
  const handleQueryChange = (event) => {
    setState(prevState => ({...prevState, query: {...prevState.query, terms: event.target.value}}));
  };
  
  const nextPage = () => {
    setState(prevState => ({
      ...prevState,
      page: prevState.page + 1,
      loading: true,
      query:{
        ...prevState.query,
        page:'next',
        paginationToken:state.response.results[state.response.results.length-1].paginationToken
      }
    }));
  }
  
  const prevPage = () => {
    setState(prevState => ({
      ...prevState,
      page: prevState.page - 1,
      loading: true,
      query:{
        ...prevState.query,
        page:'prev',
        paginationToken:state.response.results[0].paginationToken
      }
    }));
  }
  
  const handleMethodChange = (m) => {
    setState(prevState => ({...prevState, response: {}, query: {...prevState.query, method: m}}));
  };

  const handleSearchClick = () => {
    setState(prevState => ({
      ...prevState,
      page:1,
      query: {
        ...prevState.query,
        paginationToken: null,
        page:null,
        filters: {}
      }
    }));
  }
  
  const handleAddFilter = (filter,val) => {
    let copiedFilters = {...state.query.filters};
    copiedFilters[filter] = val;
    setState(prevState => ({
      ...prevState,
      page:1,
      query: {
        ...prevState.query,
        paginationToken: null,
        page:null,
        filters: copiedFilters
      }
    }));
  };
  
  const handleRemoveFilter = (field) => {
    let copiedFilters = {...state.query.filters};
    delete copiedFilters[field]
    setState(prevState => ({
      ...prevState,
      page:1,
      query: {
        ...prevState.query,
        paginationToken: null,
        page:null,
        filters: copiedFilters
      }
    }));
  }
  
  const handleInstantClick = (term) => {
    setState(prevState => ({
      ...prevState,
      query: {
        ...prevState.query,
        terms: term,
        paginationToken: null,
        page:null,
        filters: {}
      }
    }));
  }

  const handleSliderChange = (value) => {
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
      query={state.query.terms}
      handleQueryChange={handleQueryChange}
      handleSearch={handleSearchClick}
      instantResults={state.instantResults}
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
    {state.query.method == "fts"
      ?
      <div style={{display:"grid",gridTemplateColumns:"20% 80%",gap:"0px",alignItems:"start"}}>
        <div style={{paddingTop:"35px"}}>
        {state.meta?.facets
          ? 
          <Facets facets={state.meta.facets} onFilterChange={handleAddFilter}/>
          : <></>
        }
        </div>
        <div>
          {
            state.loading
            ?
            <Spinner variant="large" description="Loading…"/>
            :
            state.meta.hits > 0
              ?
              <div style={{maxWidth:"95%"}}>
                {state.query.filters? Object.keys(state.query.filters).length > 0 ? <Filters filters={state.query.filters} handleRemoveFilter={handleRemoveFilter}/> :<></>:<></>}
                <Pagination currentPage={state.page}
                  itemsPerPage={4}
                  itemsPerPageOptions={[4]}
                  numTotalItems={state.meta.hits}
                  onBackArrowClick={prevPage}
                  onForwardArrowClick={nextPage}
                />
                {state.response.results? state.response.results.map(r => (
                  <SearchResult query={state.query.terms} key={r._id} r={r} schema={schema} setPreview={setPreview}></SearchResult>
                )):<></>}
                <Pagination currentPage={state.page}
                  itemsPerPage={4}
                  itemsPerPageOptions={[4]}
                  numTotalItems={state.meta.hits}
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
