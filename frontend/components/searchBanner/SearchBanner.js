import styles from './searchBanner.module.css';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import {SearchInput} from '@leafygreen-ui/search-input';
import Button from "@leafygreen-ui/button";
import { H1, H3, Link, Body } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import { useState, useRef, useContext } from 'react';
import { UserContext } from '../auth/UserContext';
import { Children } from 'react';

export default function SearchBanner({appName,query,handleQueryChange,handleSearch,instantResults = null,instantField = null,instantClick=null,children=null}){
    const [isFocused, setIsFocused] = useState(false);
    const { user, groups } = useContext(UserContext);
    const blurTimeoutId = useRef(null);

    const handleBlur = () => {
        // Set a timeout for the onBlur event handler
        blurTimeoutId.current = setTimeout(() => {
            setIsFocused(false);
        }, 200); // 200ms should be enough, but you can adjust this value as needed
    };

    const handleFocus = () => {
        // Clear the timeout if the SearchInput is refocused before the timeout finishes
        clearTimeout(blurTimeoutId.current);
        setIsFocused(true);
    };

    let childrenArray = Children.toArray(children);

    if(user){
        const userBody = (
            <Body key="userBody" style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <span key="userLabel" style={{margin:"0px"}}>User</span>
                <span key="userValue" style={{margin:"0px"}}>{user}</span>
            </Body>
        );
        childrenArray = [...childrenArray, userBody];
    }

    const childrenElements = childrenArray.map((child, index) => (
        <div key={index} style={{width:"15%", paddingLeft:"10px", marginBottom:"20px"}}>
            {child}
        </div>
    ));
    
    const searchBarWidth = 90 - childrenElements.length*15;
    return (
        <div className={styles.container}>
            <a style={{textDecoration: 'none', color: 'inherit'}} href="/">
                <div style={{width:"200px",alignItems:"center"}}>
                    <H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1>
                    <H3 style={{textAlign:"center"}}>{appName}</H3>
                </div>
            </a>
            <div className={styles.container} style={{paddingTop:"30px",justifyContent:"end",width:"100%",paddingLeft:"16px"}}>
                <div style={{width:`${searchBarWidth}%`,marginRight:"10px",position:"relative"}}>
                    <SearchInput
                        value={query}
                        onChange={(e)=>{ e.preventDefault(); handleQueryChange(e); }}
                        onSubmit={(e)=>{ e.preventDefault(); setIsFocused(false); handleSearch(); }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        aria-label="search button"
                        style={{marginBottom:"20px"}}>
                    </SearchInput>
                    {
                        isFocused && instantResults?
                        <Card className={styles.dropdown}>
                            {instantResults?
                                instantResults.results.map(r => {
                                    return (
                                         <p key={r._id} onClick={() => {instantClick(r[instantField][r.lang])}}>
                                            <Link key={`${r._id}_link`}>{r[instantField][r.lang]}</Link>
                                        </p>
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