import React from "react";

const FB_PAGE_URL = "https://www.facebook.com/yourpage"; // Replace with your actual FB page URL

const FacebookPageEmbed = () => (
  <div className="flex flex-col items-center">
    <h3 className="mb-4 text-xl font-semibold text-gray-800">Facebook Page</h3>
    <div className="flex justify-center w-full">
      <iframe
        title="Facebook Page"
        src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FB_PAGE_URL)}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`}
        width="500"
        height="600"
        style={{ border: "none", overflow: "hidden" }}
        scrolling="no"
        frameBorder="0"
        allowFullScreen={true}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      ></iframe>
    </div>
  </div>
);

export default FacebookPageEmbed;
