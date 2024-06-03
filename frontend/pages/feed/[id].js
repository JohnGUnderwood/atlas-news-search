import Head from "next/head";
import { useRouter } from 'next/router';

import { H1,H2, H3, Subtitle, Description, Label } from '@leafygreen-ui/typography';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Button from "@leafygreen-ui/button";

// Path: frontend/pages/feed/[id].js
export default function FeedDetail(){
  const router = useRouter();
  const { id } = router.query;
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    if(id){
      axios.get(`/api/feed/${id}`)
            .then(response => {
                setFeed(response.data);
            })
            .catch(error => {
                console.error('There was an error!', error);
            });
    }
  }, [id]);

  return (
    <>
    <Head>
        <title>RSS Crawler</title>
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <p>{JSON.stringify(feed)}</p>
    </>
  );
};

async function fetchFeed(feedId) {
  return new Promise((resolve) => {
      
  });
}
