import { Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import { useState, } from 'react';
import styles from './result.module.css';

function getHighlightsHTML(highlightsField,fieldName){
    const highlightedStrings = highlightsField
        .filter(h => h.path == fieldName)
        .map(h => {
        return h.texts.map(t => {
            if(t.type === "hit"){
            return "<strong style='color:blue'>"+t.value+"</strong>"
            }else{
            return t.value
            }
        }).join('')
        
    });
    return highlightedStrings;
}

function createHighlighting(highlightsField,fieldName,fieldValue) {
    const highlightedStrings = getHighlightsHTML(highlightsField,fieldName);

    const nonHighlightedStrings = highlightsField
        .filter(h => h.path == fieldName)
        .map(h => {
        return h.texts.map(t => t.value).join('')
    });

    highlightedStrings.forEach((str,idx) => {
        fieldValue = fieldValue.replace(nonHighlightedStrings[idx],str);
    });

    return {__html: fieldValue};
}


function SearchResult({r,schema}){
    const [showHighlights, setShowHighlights] = useState(false);

    const toggleHighlights = () => {
        setShowHighlights(!showHighlights);
    }

    return (
        <Card style={{margin:"10px"}}>
            <div style={{display:"grid",gridTemplateColumns:"230px 70%",gap:"5px",alignItems:"start"}}>
                <img src={r.image} style={{maxHeight:"120px"}}/>
                <div>
                <Subtitle style={{paddingBottom:"5px"}}>
                    {r.title[r.lang]}
                </Subtitle>
                <Description>
                    {r.highlights?.length > 0
                        ?
                        <span dangerouslySetInnerHTML={createHighlighting(r.highlights,`${schema.descriptionField}.${r.lang}`,r.description[r.lang])} />
                        : 
                        r.description[r.lang]
                    }
                </Description>
                </div>
            </div>
            {getHighlightsHTML(r.highlights,`${schema.contentField}.${r.lang}`).length > 0
                ?
                <div style={{paddingTop:"25px"}}>
                    <span><Label>Content highlights - {getHighlightsHTML(r.highlights,`${schema.contentField}.${r.lang}`).length}</Label><Icon className={styles.higlightsToggle} onClick={toggleHighlights} glyph={showHighlights? "ChevronDown": "ChevronUp"} fill="None" /></span>
                    {showHighlights?
                        <Description>
                            {getHighlightsHTML(r.highlights,`${schema.contentField}.${r.lang}`).map((h,i) => (
                                <p key={`${r._id}_content_highlight_p${i}`}>...<span key={`${r._id}_content_highlight_span${i}`} dangerouslySetInnerHTML={{__html:h}}/>...</p>
                            ))}
                        </Description>
                        :
                        <></>
                    }
                </div>
                :
                <></>
            }
        </Card>
    )
}

export default SearchResult;