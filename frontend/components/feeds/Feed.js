
import axios from 'axios';
import Icon from '@leafygreen-ui/icon';
import Card from '@leafygreen-ui/card';
import { Subtitle, Label, Description, Overline, Link, H3} from "@leafygreen-ui/typography";
import { useRef, useState, useEffect } from 'react';
import Button from "@leafygreen-ui/button";
import Modal from "@leafygreen-ui/modal";
import { Spinner } from "@leafygreen-ui/loading-indicator";
import Code from '@leafygreen-ui/code';
import styles from "./feed.module.css";
import { useRouter } from 'next/router';

export default function Feed({f,feeds,setFeeds}){
    const [testResult, setTestResult] = useState(null);
    const [feed, setFeed] = useState(f);
    const [testLoading, setTestLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const intervalId = useRef();
    const router = useRouter();

    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    }


    useEffect(() => {
        if (feed.status && feed.status === 'starting' ) {
            intervalId.current = setInterval(() => {
                fetchFeed(feed._id).then(response => {
                    console.log('fetching feed');
                    setFeed(response.data);
                    // Update the feeds object in the parent component
                    setFeeds({...feeds, [feed._id]: feed});
                });
            }, 3000);
        } else if (feed.status === 'stopping' || feed.status === 'running') {
            intervalId.current = setInterval(() => {
                fetchFeed(feed._id).then(response => {
                    console.log('fetching feed');
                    setFeed(response.data);
                    // Update the feeds object in the parent component
                    setFeeds({...feeds, [feed._id]: feed});
                });
            }, 5000);
        } else {
            clearInterval(intervalId.current);
        }

        // Update the feeds object in the parent component
        setFeeds({...feeds, [feed._id]: feed});

        // Clean up on unmount
        return () => clearInterval(intervalId.current);
    }, [feed]);

    const start = (id) => {
        startCrawl(id).then(r => {
            console.log(r);
            setFeed(prevFeed => ({...prevFeed, status: r.data.status}))
        }).catch(e => console.log(e));
    };

    const stop = (id) => {
        stopCrawl(id).then(r => {
            console.log(r);
            setFeed(prevFeed => ({...prevFeed, status: r.data.status}))
        }).catch(e => console.log(e));
    };

    const clear = (id) => {
        clearCrawlHistory(id).then(response => setFeed(response.data)).catch(e => console.log(e));
    };

    const test = (id) => {
        setTestLoading(true)
        setOpen(true);
        fetchTestResult(id).then(response => {
            setTestResult(response.data);
            setTestLoading(false);
        }).catch(e => console.log(e));
    };

    const remove = (id) => {
        deleteFeed(id).then(response => {
            const newFeeds = {...feeds};
            delete newFeeds[id];
            setFeeds(newFeeds);
        }).catch(e => console.log(e));
    };

    return (
        <div>
        <Modal open={open} setOpen={setOpen}>
            <Subtitle>Test RSS Feed {feed._id}</Subtitle>
            {
                testLoading? <Spinner description="Getting test results..."/>
                :testResult? <Code style={{whiteSpace:"break-spaces"}} language={'json'} copyable={false}>{JSON.stringify(testResult,null,2)}</Code>
                :<></>
            }
        </Modal>
        <Card>
            <div className={styles.feedContainer}>
                <Link onClick={() => router.push(`/feed/${feed._id}`)}><H3>{feed.config.attribution}</H3></Link>
                <br></br>
                <Label>{`${feed.status? feed.status : 'not run'}`}</Label>
                <div>
                    <span style={{ fontWeight: "bold" }}>URL: </span><span><Link>{feed.config.url}</Link></span>
                </div>
                <div className={styles.buttonsContainer}>
                    <Button onClick={() => test(feed._id)}>Test</Button>
                    <Button variant="danger" onClick={() => remove(feed._id)}>Delete</Button>
                </div>
            </div>
            <span><Label>Crawl Details</Label><Icon className={styles.toggle} onClick={toggleDetails} glyph={showDetails? "ChevronDown": "ChevronUp"} fill="None" /></span>
            {showDetails?
            <div className={styles.crawlContainer}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                    <div>
                        <span style={{ fontWeight: "bold" }}>CSS Selectors: </span>
                        {feed.config.content_html_selectors.map((selector, index) => (
                            <div className={styles.cssSelector} key={`${feed._id}_${selector}_${index}`}>{selector}</div>
                        ))}
                        
                    </div>
                    <div>
                        <span style={{ fontWeight: "bold" }}>Language: </span><span>{feed.config.lang}</span>
                    </div>
                </div>
                <div>
                    <div>
                        <span style={{ fontWeight: "bold" }}>Last Crawled: </span><span>{feed.crawl ? `${getElapsedTime(new Date(feed.crawl.start?.$date), new Date())} ago` : 'Never'}</span>
                    
                    
                        {
                            feed.crawl ?
                            feed.crawl.duplicates.length >= feed.crawl.crawled.length?
                            <div>
                                <span>No new entries found.</span>
                            </div>
                            :<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                            
                            <div>
                                <span style={{ fontWeight: "bold" }}>Crawled: </span><span>{feed.crawl.crawled?.length}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: "bold" }}>Inserted: </span><span>{feed.crawl.inserted?.length}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: "bold" }}>Duplicates: </span><span>{feed.crawl.duplicates?.length}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: "bold" }}>Errors: </span><span>{feed.crawl.errors?.length}</span>
                            </div>
                            </div>
                            :<></>
                        }
                    </div>
                    
                </div>
                <div className={styles.buttonsContainer}>
                    {feed.status == 'running'?<Button variant="danger" onClick={() => stop(feed._id)}>Stop</Button>
                    :feed.status == 'starting'? <Button variant="primaryOutline">Start</Button>
                    :feed.status == 'stopping'? <Button variant="dangerOutline">Stop</Button>
                    :<Button variant="primary" onClick={() => start(feed._id)}>Start</Button>}
                    <Button variant="dangerOutline" onClick={() => clear(feed._id)}>Clear History</Button>
                </div>
            </div>
            :<></>}
        </Card>
        </div>
    );
};

function getElapsedTime(date1, date2) {
    const elapsed = date2 - date1;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        return `${days} days, ${remainingHours} hours, ${remainingMinutes} minutes`;
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours} hours, ${remainingMinutes} minutes`;
    } else {
        const remainingSeconds = seconds % 60;
        return `${minutes} minutes, ${remainingSeconds} seconds`;
    }
}

async function fetchFeed(feedId) {
    return new Promise((resolve) => {
        axios.get(`/api/feed/${feedId}`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

async function deleteFeed(feedId) {
    return new Promise((resolve) => {
        axios.delete(`/api/feed/${feedId}`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

async function startCrawl(feedId) {
    return new Promise((resolve) => {
        axios.get(`/api/feed/${feedId}/start`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

async function stopCrawl(feedId) {
    return new Promise((resolve) => {
        axios.get(`/api/feed/${feedId}/stop`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

async function clearCrawlHistory(feedId) {
    return new Promise((resolve) => {
        axios.get(`/api/feed/${feedId}/history/clear`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}

async function fetchTestResult(feedId) {
    return new Promise((resolve) => {
        axios.get(`/api/feed/${feedId}/test`)
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
}