

# Ondewo AIM (AI Management Platform) + Common Voice (Extension)

<e-relate-ref>jobs ondewo</e-relate-ref>
<e-time-range data="2021 2022"></e-time-range>
<e-tech-card>
    angular, typescript, docker, jasmine, eslint, webpack, ssh, linux
</e-tech-card>

At Ondewo i mainly worked on their AI - Management Platform which
was an Angular application that communicated with a python backend.
I wrote most of their ondewo-grpc-generator and proposed it as a
reuseable and maintainable method of generating our clients.

# Common Voice

<e-relate-ref>jobs ondewo</e-relate-ref>
<e-time-range data="2021 2022"></e-time-range>
<e-tech-card>
    react, typescript, sql, rest, npm, docker
</e-tech-card>

Added a feature to Mozilla's 
[Common Voice](https://github.com/common-voice/common-voice)
that provided a third data/voice/audio classification option to improve/source the dataset.

When trying out the project on 
[Common Voice Live](https://commonvoice.mozilla.org/en)
We can see 2 options: 
- Speaking into a microphone and creating audio data.
- Listening to audio samples and classifying audio samples as correct, incorrect

To this i added a feature where while listening to audio samples to user could
submit a correction or write the text which can be heared in an audio sample.
This pair is then validated by other users as well, after the submission to verify its validity.

The advantage of this approach is that any text can be recorded and any text can be classified/corrected,
therefore enabling the creation of new datasets (instead of depending on a predefined/static text dataset
for which the audio samples are spoken in).

Before that feature i analysed the exsting fork for differences to the upstream repo, in order to find out
the configuration and changes for our infrastructure & deployment, while documenting everything in the
process to later tranfer the project.
The repo also had to be merged with upstream, by cherry picking previous commits, as there had been some breaking
changes since the internal repo was updated.

Sadly my time at ondewo came to an end before i could do a PR to the public github repo
although the feature was in working conditions as i left.

# Ondewo Proto compiler
<e-relate-ref>jobs ondewo</e-relate-ref>
<e-tech-card>
    shell scripting, docker, webpack, angular, npm, grpc, protobuf
</e-tech-card>

The [Ondewo proto compiler](https://github.com/ondewo/ondewo-proto-compiler/tree/master) was one of my proposals 
in order to optimize the internal distribution and updating workflow for the used microservie APIs,
that were using the *GRPC* messaging protocol and sending data through the *protobuf* message format.

Using the *protobuf* compiler is a somewhat tricky endeavor and also requires the correct dependencies and programs to be 
installed on the machine and a good understanding thereof.

The *proto compiler* solved this issue by using a docker images for compiling the *client services* 
(which then can be imported in the target language).
The project however goes on step further and provides means for preparing those client services in a 
way to be easily usable by different target platforms.
For node.js for instance an installable npm package is generated and published.
For JavaScript in the browser a browser bundle is created (using webpack) in order to be able to 
include the services through the `<script>` tag (also inlining the node_modules deps).
For Angular the package is generated as a consumable angular package, that can be installed through `npm` as well.
For python the backend team implemented docker protocompiler in a similar approach.

Another problem to be solved was that the *protobuf compiler* could only compile `.proto` files in a particular order,
as it could not resolve dependencies and compile these dependencies before.
Because of this i had to add a simple dependency ordering algorithm for preventing this, as i wanted the compiler to be
able to consume a (mounted) directory and automatically compile any `.proto` file in that.

If you wonder why my name is not in the contributer list, that is because the project was initially developed on a 
private bitbucket repo that was then pushed to github without the git history.

# Structural Fisheye Approximation - 2020

<!--<e-time-range>
    2018
    2019
</e-time-range>-->

<e-time-range data="2020 2020"></e-time-range>
<e-relate-ref>education master</e-relate-ref>

Implementation of a network data visualization framework with options
to distort the network with a virtual fisheye lens.
Further an intelligent optimization which approximates the fisheye view
while considering several constraints (readability, structure ...) was
implemented (which was proposed in the original 2019 scientific paper
"Structure-aware Fisheye Views for Efficient Large Graph Exploration").
This was done by using a technique inspired by deep learning which is a
custom implementation of gradient descent for minimizing
(approximation) the optimization cost functions (constraints).

The Visualization was implemented using HTML5 Canvas and JavaScript,
while all the data manipulation operations were implemented with
Python and the Numpy library for the maths and matrix calculations.

<e-tech-card data="python, numpy, javascript" />

<!-- Maybe use tags to flag items like educations jobs projects in order to reference -->
<e-relate-ref>education master</e-relate-ref>

# Handstellungserkennungs AI via CNN (1yr - 2018/19)

<e-time-range data="2018 2019"></e-time-range>
<e-relate-ref>education bachelor</e-relate-ref>
<e-tech-card data="python, tensorflow" />

Implementation of a Convolutional Neural Network with TensorFlow 2
and Python.
Goal was to classify the degree of hand contraction from hand images, by
training a neural network for this task.
- Created a framework for rapid testing of different datasets and models
- Created a dataset from videos and alternatively from generated data of
a 3d model
- Trained Model and optimized result
- Implemented real time prediction of images from a feed (webcam,
video)

# flink.io

<e-tech-card data="angular, typescript, d3.js" />

Implemented Complex Barchart, PieChart and Scatterchart for the
display of data in the frontend using D3.js to create svg geomerty for
displaying financial data

# A birds eye view

<e-tech-card data="C++, OpenGL, GLSL" />

Our Team (2 people) implemented a realtime 3d graphics demo with
OpenGL, consisting of realtime cascaded shadow maps and camera-
orientation based tessellation which displayed a terrain in different levels
of detail.

# PuzzlePlane

<e-tech-card data="C++, OpenGL" />

Development of a small OpenGL based 3d game engine to showcase a
small demo game with the following self-implemented effects:
CEL shading, Bloom, Environment mapping, Phong shading, Collision
detection with the bullet physics library

# Aymatic Web (1yr)

<e-tech-card>
    Angular, NodeJs, Typescript,
    Javascript, HTML, CSS,
    FFmpeg, PHP, Amazon AWS
</e-tech-card>

- Automatic video creation using product data from websites.
- Could take your shop and automatically create videos with music and
visualization from your products and inserts those videos into your shop.
- All of that fully automatically.
- Manual selection of content was also possible (was used for videos of
cars from a car reseller)

AES encrypted communication with custom Prestashop PHP - plugin.

# Power Mind Map

<e-tech-card>
    C#, UWP
</e-tech-card>

Vector Graphics Mind Mapping App for Windows 8 and 10,
implemented using C#, XAML and Universal Windows Platform UWP

# Power Mind Map Reloaded

<e-tech-card>
    Typescript, Angular, NodeJS
</e-tech-card>

Reimplementation of the Mind Mapping App with Web technologies,
mainly Angular, Typescript and NodeJS, with a more sophisticated and
maintainable Software Architecture.
Creation of a 2D rendering and memory management engine based on
Canvas drawing for that purpose, to be able to reuse it for different
purposes as well.

# Custom Websites
<e-tech-card> 
    HTML5, CSS3, Javascript
</e-tech-card>

- http://www.lichtblicke4you.at
- https://www.lebenskraft-aktiv.at
- https://www.markuspeitl.com

# Wordpress Templates
<e-tech-card> 
    PHP, HTML5, CSS3
</e-tech-card>

A Wordpress template was created on the basis of a
static website: http://www.markuspeitl.com

# Self Check in Terminal 
<e-tech-card> 
    Java EE, REST, Payment APIs
</e-tech-card>

Our Team developed a self-check in terminal for a hostel,
it consisted of a tough surface and customers could check themselves in
and pay for the stay in the hostel.
Features included:
- Tracking of rooms
- Communication with internal management system
- Payment via Credit Card Terminal
- Touch Screen support
- Localisation

# Robotracking
<e-tech-card> 
    C++, OpenCV
</e-tech-card>

- Automatisation of a robot crane, utilizing 2 webcams.
- The cranes purpose was to pick up a colored ball, the webcams and the
sofware had to recognize the crane and the ball under the crane and
send appropriate instructions to the robot to accomplish that task.

# ProApp/Aymatic Video (2yrs)

<e-tech-card> 
    Android, C#, Xamarin,
    FFmpeg, Firebase
</e-tech-card>

- Guided video creation using Android app.
- Full video recording, editing, sampling, rendering, video project
management software which guides the user through the video creation
process informed by expert knowledge (in video marketing).
- Worked exceptionally well for event videos.
- Recording Module:
Custom Video Recorder guiding the user, with a transparent overlay to
show the subject to be filmed and visual queues for timing the length of
the shot (MediaRecorder, Camera, SurfaceTexture)
Focus with custom focus rectangle and camera settings management by
the app.
- Player Module:
Custom Video Player with accurate seeking (using ExoPlayer2 api)
Live virtual cutting:, only the selected section of the timeline was played
- Project Management Module:
Projects could be created and listed based on different templates.
Inside the Projects the shots were listed, could be moved around,
deleted, music selected, animations selected.
Involved recycling views and adding lightweight objects which would load
missing data later by using a proxy like pattern.
- Firebase Module:
Connection to google firebase for authentication, user management,
downloading of selected content used by the application.
Creation of objects based on online data using Factory Pattern.
- Rendering Module:
FFmpeg (native C++ library) custom built in Linux for use with Android (as
a custom build for ARM was compiled to use a LGPL licence instead of
the default GPL licence).
FFmpeg was used to cut the video, add animations, remix music + audio
and put everything together into a single video.
- Preview Player: Playing a preview of the full video without rendering
Common Module:
A PCL (Portable Class Library) Library for sharing models and behaviors
between platforms.
Whole Project was refactored several times, where heavy emphasis on
abstraction, modularization and reusability was enforced.

# Manga Sketch Colorization - A State of the Art Report
<e-tech-card> 
    LaTex, Scientific Writing
</e-tech-card>

A state of the art report of recent developments in automatic line sketch
colorization using deep learning machine learning based algorithms.
Review of 10 different scientific paper proposing methods for learning
based colorization mostly using conditional Generative Adversarial
Networks and AutoEncoder architectures for producing high quality
illustrations from training the colorization process on big datasets.
The resulting paper was then presented in front of a technical audience.