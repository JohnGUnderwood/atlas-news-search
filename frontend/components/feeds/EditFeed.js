
import axios from 'axios';
import { useEffect, useState } from 'react';
import Button from "@leafygreen-ui/button";
import Form from "./Form";
import { Spinner } from '@leafygreen-ui/loading-indicator';
import Code from '@leafygreen-ui/code';
import { useApi } from "../useApi";

export default function EditFeed({setFeeds,setOpen,feed,setFeed}){
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(
        {
            name: feed.name,
            lang: feed.config.lang,
            url: feed.config.url,
            attribution: feed.config.attribution,
            content_html_selectors:feed.config.content_html_selectors,
            date_format: feed.config.date_format
        });
    const api = useApi();
    api.setHeaders({'Content-Type' : 'application/json'});

    const handleSubmit = () => {
        const newFeed = {
            'name': formData.name,
            'config': {
                'lang': formData.lang,
                'url': formData.url,
                'content_html_selectors': formData.content_html_selectors,
                'attribution': formData.attribution,
                'date_format': formData.date_format,
            }
        };
        setLoading(true);
        // Submit the new feed data
        api.put(`feeds/${feed._id.$oid}`, newFeed)
        .then(response => {
            setLoading(false);
            setFeeds(newFeeds => ({
                ...newFeeds,
                [feed._id.$oid]: response.data
            }));
            setFeed(response.data);
            setOpen(false);
        })
        .catch(e => {
            console.log(e);
            setTestResult(e.response.data);
            setLoading(false);
        });
    }

    const testFeed = () => {
        // Remove blank content_html_selectors
        const newFormData = {...formData};
        newFormData.content_html_selectors = newFormData.content_html_selectors.filter(selector => selector !== '');
        setFormData(newFormData);
        setLoading(true)
        api.put(`test`, newFormData)
        .then(response => {
            setTestResult(response.data);
            setLoading(false);
        }).catch(e => {
            console.log(e);
            setTestResult(e.response.data);
            setLoading(false);
        });
    };

    return (
        <div>
            {loading?
                <Spinner variant="large" description="Loading…"/>
            : testResult? 
                <>
                    <Code style={{whiteSpace:"break-spaces"}} language={'json'} copyable={false}>{JSON.stringify(testResult,null,2)}</Code>
                    <div style={{marginTop:"10px", display:"flex", gap:'10px'}}>
                        <Button variant="primary" onClick={handleSubmit}>Submit Feed</Button>
                        <Button variant="dangerOutline" onClick={() => setTestResult(null)}>Go Back</Button>
                    </div>
                </>
            :   <>
                    <Form formData={formData} setFormData={setFormData}></Form>
                    <Button onClick={testFeed}>Test Feed</Button>
                </>
            }
        </div>
    );
}