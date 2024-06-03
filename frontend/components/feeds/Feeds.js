import Feed from './Feed'

export default function Feeds({feeds,setFeeds}){
    return (
        <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap:'10px', padding:"10px"}}>
            {feeds?
                Object.keys(feeds).map(key => (
                    <Feed key={key} f={feeds[key]} feeds={feeds} setFeeds={setFeeds}/>
                ))
            :<></>
            }
            </div>
        </div>
        );
    };