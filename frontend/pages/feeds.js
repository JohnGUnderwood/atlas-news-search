import Feeds from "../components/feeds/Feeds";
import Head from "next/head";
import { H1,H2, H3, Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Submit from "../components/feeds/Submit";
import Modal from "@leafygreen-ui/modal";
import { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBanner from "../components/searchBanner/SearchBanner";
import Button from "@leafygreen-ui/button";

export default function Home(){
  const [open, setOpen] = useState(false);
  const [feeds,setFeeds] = useState(null)
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if(query && query != ""){
        getInstantResults(query)
        .then(resp => setFeeds(resp.data))
        .catch(error => console.log(error));
    }else{
        fetchFeeds();
    }
  };

  const handleQueryChange = (event) => {
    setFeeds(null);
    setQuery(event.target.value);
    if(event.target.value && event.target.value != ""){
        getInstantResults(event.target.value)
        .then(resp => setFeeds(resp.data))
        .catch(error => console.log(error));
    }else{
        fetchFeeds();
    }
  };

  const fetchFeeds = async () => {
    console.log("fetching feeds")
    try {
        const response = await getFeeds();
        setFeeds(response.data);
    } catch (e) {
        console.log(e);
    }
  };

  useEffect(() => {fetchFeeds()}, []);

  return (
    <>
    <Head>
        <title>RSS Crawler</title>
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <SearchBanner appName="RSS Crawler" query={query} handleQueryChange={handleQueryChange} handleSearch={handleSearch}/>
    <Modal open={open} setOpen={setOpen}>
      <Subtitle>Add Feed</Subtitle>
      <Submit setFeeds={setFeeds} setOpen={setOpen}/>
    </Modal>
    <div style={{paddingTop:"50px"}}>
      <Button style={{marginLeft:"30px"}} onClick={()=>setOpen(true)}>Add Feed</Button>
      <Feeds feeds={feeds} setFeeds={setFeeds}/>
    </div>
    </>
  );
};

async function getFeeds() {
  return new Promise((resolve) => {
    axios.get(`/api/feeds`)
      .then(response => resolve(response))
      .catch((error) => {
          console.log(error)
          resolve(error.response.data);
      });
  });
};

async function getInstantResults(query) {
  return new Promise((resolve) => {
    axios.get(`/api/feeds/search?q=${query}`)
    .then(response => resolve(response))
    .catch((error) => {
        console.log(error)
        resolve(error.response.data);
    });
  });
};
