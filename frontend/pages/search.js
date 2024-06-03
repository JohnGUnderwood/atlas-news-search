import axios from 'axios';
import Header from '../components/head';
import jwt from 'jsonwebtoken';
import { Facets, Filters, SearchResult, ChunksResult }from '../components/search'
import { useState, useEffect} from 'react';
import Pagination from '@leafygreen-ui/pagination';
import { Option, OptionGroup, Select, Size } from '@leafygreen-ui/select';
import { Spinner } from '@leafygreen-ui/loading-indicator';
import SearchBanner from '../components/searchBanner/SearchBanner';
import { Body } from '@leafygreen-ui/typography';

const api = axios.create({
  baseURL: '/',
});

export default function Home(context){
  const [state, setState] = useState({
    query: {terms:'',method:'fts',filters:{}},
    page: 1,
    response: {},
    meta: {hits:0},
    loading: null,
    instantResults: null,
    preview: {id:'',show:false},
    token: null,

  });
  const schema = {
    descriptionField : "summary",
    contentField : "content",
    titleField : "title",
    imageField : "media_thumbnail",
    vectorField : "embedding",
    facetField : "tags",
  }

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE ? process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE : context.req?.headers['x-kanopy-internal-authorization'];
    var user = jwt.decode(token)['sub'];
    api.defaults.headers.put['User'] = user;
    setState(prevState => ({...prevState, user: user}));

  }, []);
  
  useEffect(() => {
    handleSearch();
  },[state.query.filters,state.query.method]);
  
  useEffect(() => {
    if(state.query.terms && state.query.terms != ''){
      getTypeahead(state.query)
      .then(resp => {
        setState(prevState => ({...prevState, instantResults: resp.data}));
      })
    }else if(state.query.terms == ''){
      setState(prevState => ({...prevState, instantResults: null, response: {}, meta: {hits:0}}));
    }
  },[state.query.terms]);
  
  const setPreview = (id) => {
    setState(prevState => ({...prevState, preview: {id:id,show:!prevState.preview.show}}));
  }

  const handleSearch = () => {
    if(state.query && state.query.terms && state.query.terms != ""){
      setState(prevState => ({...prevState, loading: true}));
      getSearchResults(state.query)
      .then(resp => {
        setState(prevState => ({...prevState, loading: false, response: resp.data}));
      })
      .catch(error => console.log(error));
  
      getMeta(state.query)
      .then(resp => setState(prevState => ({...prevState, meta: resp.data})))
      .catch(error => console.log(error));
    }
  }
  
  const handleQueryChange = (event) => {
    setState(prevState => ({...prevState, query: {...prevState.query, terms: event.target.value}}));
  };
  
  const nextPage = () => {
    setState(prevState => ({...prevState, page: prevState.page + 1, loading: true}));
    getSearchResults({...state.query,page:'next',token:state.response.results[state.response.results.length-1].paginationToken})
    .then(resp => {
      setState(prevState => ({...prevState, loading: false, response: resp.data}));
    })
    .catch(error => console.log(error));
  }
  
  const prevPage = () => {
    setState(prevState => ({...prevState, page: prevState.page - 1, loading: true}));
    getSearchResults({
      ...state.query,
      page: 'prev',
      token: state.response.results[0].paginationToken
    })
    .then(resp => {
      setState(prevState => ({...prevState, loading: false, response: resp.data}));
    })
    .catch(error => console.log(error));
  }
  
  const handleMethodChange = (m) => {
    setState(prevState => ({...prevState, response: {}, query: {...prevState.query, method: m}}));
  };
  
  const handleAddFilter = (filter,val) => {
    let copiedFilters = {...state.query.filters};
    copiedFilters[filter] = val;
    setState(prevState => ({...prevState, query: {...prevState.query, filters: copiedFilters}}));
  };
  
  const handleRemoveFilter = (field) => {
    let copiedFilters = {...state.query.filters};
    delete copiedFilters[field]
    setState(prevState => ({...prevState, query: {...prevState.query, filters: copiedFilters}}));
  }
  
  const handleInstantClick = (term) => {
    console.log("handleInstantClick",term)
    setState(prevState => ({...prevState, query: {...prevState.query, terms: term}}));
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
      query={state.query.terms}
      handleQueryChange={handleQueryChange}
      handleSearch={handleSearch}
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
      {
        state.user? 
          <Body style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <p style={{margin:"0px"}}>User</p>
            <p style={{margin:"0px"}}>{state.user}</p>
          </Body>
        : <></>
      }
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
      api.post(`search/${method}?${params}`,
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
      api.post(`search/meta?${params}`,
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
      api.post(`typeahead?${params}`,
        body
      )
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      })
  });
}
