import { Subtitle, Description, Label, Link } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import { useState, } from 'react';
import styles from './results.module.css';
import Preview from './preview';

function getHighlighting(highlightsField,fieldName){
    const highlightedStrings = highlightsField
        .filter(h => h.path == fieldName)
        .map(h => {
            const highlighted = h.texts.map(t => {
                if(t.type === "hit"){
                    return "<strong style='color:blue'>"+t.value+"</strong>"
                }else{
                    return t.value
                }
            }).join('')
            const original = h.texts.map(t => t.value).join('')
            return {original:original,highlighted:highlighted};
        
        });
    return highlightedStrings;
}

function createHighlighting(highlightsField,fieldName,fieldValue) {
    const highlightedStrings = getHighlighting(highlightsField,fieldName);
    highlightedStrings.forEach((v) => {
        fieldValue = fieldValue.replace(v.original,v.highlighted);
    });
    return {__html: fieldValue};
}


export default function SearchResult({r,schema,query}){
    const [showHighlights, setShowHighlights] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const toggleHighlights = () => {
        setShowHighlights(!showHighlights);
    }

    const contentHighlighting = getHighlighting(r.highlights,`${schema.contentField}.${r.lang}`);
    const descriptionHighlighting = createHighlighting(r.highlights,`${schema.descriptionField}.${r.lang}`,r.description[r.lang]);

    return (
        <>
        <Preview query={query} id={r._id} show={showPreview} setShow={setShowPreview} highlights={contentHighlighting}></Preview>
        <Card style={{margin:"10px"}}>
            <Label>{r.attribution}</Label>
            <div style={{display: 'flex',gap:'10px'}}>
                {r.image?<img src={r.image} style={{maxHeight:"120px"}}/>:<></>}
                <div>
                    <Link onClick={()=> setShowPreview(true)}>
                        <Subtitle style={{paddingBottom:"5px"}}>{r.title[r.lang]}</Subtitle>
                    </Link>
                    <Description>
                        {r.highlights?.length > 0
                            ?
                            <span dangerouslySetInnerHTML={descriptionHighlighting} />
                            : 
                            r.description[r.lang]
                        }
                    </Description>
                </div>
            </div>
            {contentHighlighting.length > 0
                ?
                <div style={{paddingTop:"25px"}}>
                    <span><Label>Content highlights - {contentHighlighting.length}</Label><Icon className={styles.toggle} onClick={toggleHighlights} glyph={showHighlights? "ChevronDown": "ChevronUp"} fill="None" /></span>
                    {showHighlights?
                        <Description>
                            {contentHighlighting.map((h,i) => (
                                <p key={`${r._id}_content_highlight_p${i}`}>...<span key={`${r._id}_content_highlight_span${i}`} dangerouslySetInnerHTML={{__html:h.highlighted}}/>...</p>
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
        </>
    )
}