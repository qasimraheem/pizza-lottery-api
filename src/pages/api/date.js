import React, { useEffect, useState } from "react";
import Date from "../../../api/date";

function Index() {
  // const [date, setDate] = useState(null);
  // useEffect(() => {
  //   async function getDate() {
  //     const res = await fetch('/api/date');
  //     const newDate = await res.text();
  //     setDate(newDate);
  //   }
  //   getDate();
  // }, []);
  return (
    <main>
      <h1>New Date is This</h1>
      ${Date()}
      <h2>The date according to Node.js (TypeScript) is:</h2>
      {/*<p>{date ? date : 'Loading date...'}</p>*/}
    </main>
  );
}

export default Index;