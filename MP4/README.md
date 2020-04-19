# MP4: A Simple Physics Engine

## Results

### [DEMO](mp4.html)

* Press <kbd>a</kbd> to add 1 particle <br>
* Press <kbd>s</kbd> to add 10 particles <br>
* Press <kbd>d</kbd> to remove all particles <br>
* Press <kbd>r</kbd> to reset

![Particles](img/particles.png)

![Add Particles](img/add_particles.gif)

## Goals

Write a simple particle system using WebGL to handle the display. Particle systems are typically used to model fine-grained physical effects like fire, smoke, and water. We will do something simpler and just render a system of bouncing spheres in 3D. The specifics of how you implement the following features are up to you…write an app that you think is fun…

Your program will render a set of spheres bouncing around an invisible (or visible if you wish…) 3D box. You could use a box with corners (-1,-1,-1) to (1,1,1) for example. When a sphere hits one of the walls in the box, it should reflect in physically realistic manner.

### Particles

You should keep an array or list of particles.

Each particle will be have a postion P and velocity V…both of these quantities will be three-dimensional. Each particle will be represented by a sphere. You should have each sphere have an individual color and radius. It is acceptable for some speheres to appear identical, but your code should generate a variety of different-looking spheres. Use the Phong or Blinn-Phong reflection model and Phong shading (i.e. per-fragment shading)…have the spheres look nice.

You only need to generate one sphere mesh…you simply draw that mesh in multiple different spots each frame…once for each particle. You can use some of the code on the course website that can generate and render a sphere.

### User Interface

Your user interface should allow you to create spheres using a mouse click or key press. Each creation event should create n spheres, where n is some number of your choosing.

The spheres should be genereated with a semi-random position and velocity. It doesn’t have to be truly random, but there should be some variety.

You will need to bound those values to be reasonable (e.g. position inside the box). You will also need a reset button that will remove all existing spheres from the scene.

### Physics

After rendering a frame showing the current position of the spheres, you will need to update the position and velocity of each sphere:

* Update the position using the current velocity and Euler integration
* Update the velocity using the acceleration and Euler integration and drag.
* Update the acceleration using the forces of gravity.

Implement 2 forces that affect the spheres: gravity and friction. If you want to violate physics for fun and have the spheres gain velocity after hitting walls, you can implement a mode to do that as we
