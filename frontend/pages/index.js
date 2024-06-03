import {H1, H3} from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import Card from '@leafygreen-ui/card';

export default function Home(){
    return (
        <div>
            <div style={{alignItems:"center"}}>
                <H1 style={{textAlign:"center"}}><MongoDBLogoMark height={35}/>Atlas</H1>
                <H3 style={{textAlign:"center"}}>Atlas News Demo</H3>
            </div>
            <div style={{paddingTop:"15%",display:"flex",flexDirection:"row",gap:"5vw",justifyContent:"center",alignItems:"center"}}>
                <Card href="/search" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <H3>Search UI</H3>
                    <p>Search your indexed rss feeds!</p>
                </Card>
                <Card href="/feeds" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <H3>RSS Feeds</H3>
                    <p>Setup rss feeds for indexing!</p>
                </Card>
            </div>
        </div>
    );
}
