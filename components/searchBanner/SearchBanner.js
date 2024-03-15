import styles from './SearchBanner.module.css';
import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import {SearchInput, SearchResult} from '@leafygreen-ui/search-input';
import Button from "@leafygreen-ui/button";
import { H1, H3 } from '@leafygreen-ui/typography';

export default function SearchBanner({appName,handleQueryChange,handleSearch,instantResults = null,instantField = null}){
    
    return (
        <div className={styles.container}>
            <div style={{width:"200px",alignItems:"center"}}>
                <H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1>
                <H3 style={{textAlign:"center"}}>{appName}</H3>
            </div>
            <div className={styles.container} style={{paddingTop:"30px",justifyContent:"end",width:"100%",alignItems:"middle",paddingLeft:"16px"}}>
                <div style={{width:"90%",marginRight:"10px"}}>
                    <SearchInput onChange={(e)=>handleQueryChange(e)} aria-label="some label" style={{marginBottom:"20px"}}>
                    {instantResults?
                        instantResults.results.map(r => {
                            return (
                              <SearchResult key={r._id}>
                                <span>{r[instantField][r.lang]}</span>
                              </SearchResult>
                            );
                        })
                        :<></>
                    }
                    </SearchInput>
                </div>
                <div><Button onClick={()=>handleSearch()} variant="primary">Search</Button></div>
            </div>
        </div>
    )
}