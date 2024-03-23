import styles from './searchBanner.module.css';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import Button from "@leafygreen-ui/button";
import { H1, H3 } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import { useState } from 'react';

export default function SearchBanner({appName,query,handleQueryChange,handleSearch,instantResults = null,instantField = null,children=null}){
    const [isFocused, setIsFocused] = useState(false);

    var childrenElements = [];
    if(Array.isArray(children)){
        childrenElements = children.map((child,index) => {
            return (
                <div key={index} style={{width:"15%",paddingLeft:"10px",marginBottom:"20px"}}>
                    {child}
                </div>
            );
        });
    }else if(children){
        childrenElements = [(
            <div key={0} style={{width:"15%",paddingLeft:"10px",marginBottom:"20px"}}>
                {children}
            </div>
        )];
    }
    const searchBarWidth = 90 - childrenElements.length*15;
    return (
        <div className={styles.container}>
            <div style={{width:"200px",alignItems:"center"}}>
                <H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1>
                <H3 style={{textAlign:"center"}}>{appName}</H3>
            </div>
            <div className={styles.container} style={{paddingTop:"30px",justifyContent:"end",width:"100%",paddingLeft:"16px"}}>
                <div style={{width:`${searchBarWidth}%`,marginRight:"10px",position:"relative"}}>
                    <SearchInput
                        value={query}
                        onChange={(e)=>{ e.preventDefault(); handleQueryChange(e); }}
                        onSubmit={(e)=>{ e.preventDefault(); setIsFocused(false); handleSearch(); }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        aria-label="search button"
                        style={{marginBottom:"20px"}}>
                    </SearchInput>
                    {
                        isFocused && instantResults?
                        <Card style={{
                            position: 'absolute',
                            top: '100%', // Position it right below the SearchInput
                            left: 0, // Align it to the left edge of the parent container
                            right: 0, // Align it to the right edge of the parent container
                            zIndex: 1, // Make it appear in front of the other components
                          }}>
                            {instantResults?
                                instantResults.results.map(r => {
                                    return (
                                        <p key={r._id} >{r[instantField][r.lang]}</p>
                                    );
                                })
                                :<></>
                            }
                        </Card>
                        :<></>
                    }
                </div>
                <div style={{marginBottom:"20px"}}>
                    <Button onClick={()=>handleSearch()} variant="primary">Search</Button>
                </div>
                {childrenElements?childrenElements:<></>}
            </div>
        </div>
    )
}