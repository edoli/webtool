import { useEffect } from "react";

interface PageInfo {
  title: string;
}

const BasePage = (pageInfo: PageInfo) => {
  useEffect(() => {
    document.title = pageInfo.title;
  });
}


export default BasePage;