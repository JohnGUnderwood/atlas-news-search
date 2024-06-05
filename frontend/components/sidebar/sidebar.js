import Link from 'next/link';
import styles from './sidebar.module.css'; // Import your CSS module
import { useContext } from 'react';
import { UserContext } from '../auth/UserContext';
import { Description } from '@leafygreen-ui/typography';
import { palette } from '@leafygreen-ui/palette';

const Sidebar = ({nav,setNav}) => {
  const { user, groups } = useContext(UserContext);
  return (
    <div className={styles.sidebar} style={{backgroundColor:palette.green.light3}}>
      {user?<Description key="userValue" style={{textAlign:"center",fontWeight:"bolder"}}>{user}</Description>:<></>}
      <ul>
        <li style={nav === "search" ? {backgroundColor:palette.green.light1} : {}}>
          <a onClick={() => setNav('search')} style={nav === "search" ? {color:palette.green.dark3} : {color:palette.green.dark1}}>Search UI</a>
        </li>
        <li style={nav === "feeds" ? {backgroundColor:palette.green.light1} : {}}>
          <a onClick={() => setNav('feeds')}  style={nav === "feeds" ? {color:palette.green.dark3} : {color:palette.green.dark1}}>RSS Feeds</a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;