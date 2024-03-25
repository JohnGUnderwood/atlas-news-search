import { Subtitle, Description, Label } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import Icon from '@leafygreen-ui/icon';
import { useState, } from 'react';
import styles from './chunks.module.css';

export default function ChunksResult({r,schema}){
    const [showChunks, setShowChunks] = useState(false);

    const toggleChunks = () => {
        setShowChunks(!showChunks);
    }

    return (
        <Card style={{margin:"10px"}}>
            <Label>{r.attribution}</Label>
            <div style={{display: 'flex',gap:'10px'}}>
                <div>
                    <Subtitle style={{paddingBottom:"5px"}}>
                        {r.title}
                    </Subtitle>
                    <Label>Most Relevant Chunk: {r.chunks[0].chunk} - Score: {r.chunks[0].score.toFixed(5)}</Label>
                    <Description>
                        {r.chunks[0].content}
                    </Description>
                </div>
            </div>
            {r.chunks.length > 1
                ?
                <div style={{paddingTop:"25px"}}>
                    <span><Label>{r.chunks.length - 1} more chunks</Label><Icon className={styles.toggle} onClick={toggleChunks} glyph={showChunks? "ChevronDown": "ChevronUp"} fill="None" /></span>
                    {showChunks?
                        <Description>
                            {r.chunks.slice(1).map((c,i) => (
                                <div className={styles.chunk}  key={`${r._id}_chunk_p${i}`}>
                                    <Label key={`${r._id}_score_p${i}`}>Chunk: {c.chunk} - Score: {c.score.toFixed(5)}</Label>
                                    <div key={`${r._id}_content_p${i}`}>{c.content}</div>
                                </div>
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