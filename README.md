<img border="2" src="textures/images/FM2_shadow..png" style="float: center">

<h2>My Aviation Resources Repository (rev. 1 Jun 2025)</h2>
<p>
This repository contains aviation-related resources designed to simulate 3D flight in three.js.
</p><p>
This includes a flight simulation module (Flight), an iFFT ocean wave generator module (Ocean), and a fully animated WWII fighter airplane (FM2).
</p><p>
The repository includes several sample programs that show how to use these resources.
</p><ul>
	<li>The fdem programs show a basic airplane flying over the ocean and land (using the applicable modules).</li>
	<li>The fmod programs show detailed airplane models flying over an animated ocean.</li>
	<li>The fsim programs are basic flight simulation which use the flight, grid and ocean simulation modules.</li>
</ul><p>
You can run these programs and load these resources using the following syntax:
<pre>https://philcrowther.github.io/Aviation/file_name</pre>

For example:<br>
https://philcrowther.github.io/Aviation/fmod_FM2_ocean_gpu_gh.html<br>
https://philcrowther.github.io/Aviation/fsim_FM2_ocean_gpu_gh.html

NOTES:
<p>
The Modules are located in the JSM directory and include the Flight Module, the GrdMap Module (a grid for use with land-based programs), the Ocean Module (a WebGPU iFFT wave generator), the GrdWtr Module (a grid for use with the Ocean Module), the AnimFM2 Module (loads and animates the FM2 model), and an Effects Module (contains subroutines to create gunfire and explosions, smoke and ship wakes, and fade to/from black). To avoid confusion, the JSM directory now contains only the latest versions of these Modules.  These all work with WebGPU (r180).
</p><p>
Special thanks to Attila Schroeder for his encouragement and assistance in converting everything to NodeMaterials and WebGPU. And to all the volunteers at three.js who took on the daunting task of modifying three.js to work with NodeMaterials and WebGPU. And to all the other three.js programmers who took the time to answer my questions.
</p><p>
The programs and modules are discussed in more detail at our Aviation Webpage [http://philcrowther.com/Aviation/].
</p>
