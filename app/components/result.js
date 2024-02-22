import { Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';

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

    return (
        <Card>
            <div style={{display:"grid",gridTemplateColumns:"160px 75%",gap:"5px",alignItems:"start"}}>
                <img src={r.image} style={{maxHeight:"75px"}}/>
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
            <div>
                <Label>Content hits - {getHighlightsHTML(r.highlights,`${schema.contentField}.${r.lang}`).length}</Label>
                <Description>
                    {getHighlightsHTML(r.highlights,`${schema.contentField}.${r.lang}`).map((h,i) => (
                        <p key={`${r._id}_content_highlight_p${i}`}>...<span key={`${r._id}_content_highlight_span${i}`} dangerouslySetInnerHTML={{__html:h}}/>...</p>
                    ))}
                </Description>
            </div>
        </Card>
    )
}

export default SearchResult;