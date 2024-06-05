import { useState } from 'react';
import Sidebar from '../components/sidebar/sidebar';
import SearchPage from './search';
import Header from '../components/head';
import { UserProvider } from '../components/auth/UserProvider';
import FeedsPage
 from './feeds';
export async function getServerSideProps(context) {
    let token = process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE ? process.env.NEXT_PUBLIC_LOCALDEVJWTOVERRIDE : context.req.headers['x-kanopy-internal-authorization'];

    if(!token){
        token = null;
    }
    // Pass the token to your component as a prop
    return { props: { token } };
}


export default function Home({token}){
    const [nav, setNav] = useState("search");
    return (
        <UserProvider token={token}>
            <Header/>
            <div style={{display:"inline-flex",flexDirection:"row",justifyContent:"end"}}>
            { nav == 'search' ? <SearchPage/> : <FeedsPage/> }
            <Sidebar nav={nav} setNav={setNav} />
            </div>
        </UserProvider>  
    );
}