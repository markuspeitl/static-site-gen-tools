async function getData(eleventyInfo){

    //console.log(eleventyInfo);
    return {
        tags: ['page'],
        layout: 'components/page.layout.ts',
        permalink: '/content/page.html'
        //title: 'Noch kein Titel vergeben',
        //Reroute from /content/pages/ to /
        /*permalink: (data) => {
            const filePathStem = data.page.filePathStem;
            return reRoutePermalinkRoot(filePathStem, 'content/pages', '');
        }*/
    };
}

module.exports = getData;