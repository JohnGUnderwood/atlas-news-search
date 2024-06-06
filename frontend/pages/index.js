import { useState } from 'react';
import Sidebar from '../components/sidebar/sidebar';
import SearchPage from './search';
import Header from '../components/head';
import { UserProvider } from '../components/auth/UserProvider';
import FeedsPage from './feeds';

export async function getServerSideProps(context) {
    let token = process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE ? process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE : context.req.headers['x-kanopy-internal-authorization'];
    if(!token){
        token = null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3010';

    // Pass the token to your component as a prop
    return { props: { apiUrl, token } };
}

export default function Home({apiUrl,token}){
    const [nav, setNav] = useState("search");
    return (
        <UserProvider apiUrl={apiUrl} token={token}>
            <Header/>
            <div style={{display:"inline-flex",flexDirection:"row",justifyContent:"end"}}>
            { nav == 'search' ? <SearchPage/> : <FeedsPage/> }
            <Sidebar nav={nav} setNav={setNav} />
            </div>
        </UserProvider>  
    );
}