import styles from "./preview.module.css";
import Icon from "@leafygreen-ui/icon";
import { useState, useEffect} from 'react';
import axios from "axios";
import Card from "@leafygreen-ui/card";
import { H3, Link} from "@leafygreen-ui/typography";

export default function Preview({id,query,show,setShow,highlights}){
    const [html, setHtml] = useState('');
    const [result, setResult] = useState({});
    useEffect(() => {
        if(show && id != '' && query && query != ''){
            getContent(id,query)
            .then(response => {
                const lang = response.data.lang;
                var html = '';
                response.data.content[[lang]].map((c) => {
                    for(let h of highlights){
                        c = c.replace(h,`<strong style='color:blue'>${h}</strong>`);
                    }
                    html += `<p>${c}</p>`
                });
                highlights.map((h) => {
                    html = html.replace(h.original,h.highlighted);
                });
                setHtml(html);
                setResult(response.data);
            });
        }
    },[id,query,show]);

    return (
        show && result.title?
            <Card className={styles.previewDiv}>
                <div className={styles.previewHeading} >
                    <div>
                        <Icon glyph="X" size="xlarge" onClick={() => setShow(false)}/>
                    </div>
                    <div>
                        <Link target="_blank" href={result.link}>
                            <H3>{result.title[result.lang]}</H3>
                        </Link>
                    </div>
                </div>
                <div dangerouslySetInnerHTML={{__html:html}}></div>
            </Card>
        :<></>
    )
}

async function getContent(id,query) {
    return new Promise((resolve) => {
        axios.post('api/fetch',{id:id,query:query,field:"content"})
        .then(response => resolve(response))
        .catch((error) => {
            console.log(error)
            resolve(error.response.data);
        })
    });
  }