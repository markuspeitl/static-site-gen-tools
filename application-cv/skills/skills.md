---

title: Knowledge & Skills

expert:
- Git
- Typescript
- Angular
- Python
- Jira
- Docker
- Node.js
- HTML5
- CSS3
- JavaScript
- SQL Databases
- NoSQL Databases
- FFmpeg
- Visual Studio Code
- JSON
- XML
- Express
- NPM
- Bash
- Linux Automatization
- Linting
- JWT
- D3.JS
- JQuery
- Handlebars
- Numpy

extensive:
- C#
- Xamarin
- Android SDK
- Java
- C
- C++
- Tensorflow
- PyTorch
- .NET-Development
- OpenCV
- PHP
- OpenGL
- UWP
- Visual Studio
- GRPC messaging
- Webpack
- XML

some: 
- React
- Unity Engine
- UWP
- XAML
- LaTex
- Google APIs

minimal:  
- svelte
- vue.js


levels: 
    expert: 4
    extensive: 3
    some: 2
    minimal: 1

#layout: ./skills.component.ts
---

<e-import>../base/tag-crumbs</e-import>

# {{ title }}

<tag-crumbs>
    <title>Expert/Professional level</title>
    <tagList>{{ expert }}</tagList>
<tag-crumbs>

<tag-crumbs>
    <title>Extensive</title>
    <tagList>{{ extensive }}</tagList>
<tag-crumbs>

<tag-crumbs>
    <title>Some usage</title>
    <tagList>{{ some }}</tagList>
<tag-crumbs>

<tag-crumbs>
    <title>Minimal</title>
    <tagList>{{ minimal }}</tagList>
<tag-crumbs>