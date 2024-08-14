<h2>An Aviation Resources Repository</h2>
<p>
This repository contains aviation-related resources designed to simulate 3D flight in three.js.<br>
This includes a flight simulation module (FlightW3), an ocean simulation module (Ocean3 through Ocean 4a), and a fully animated WWII fighter airplane (FM2).<br>
The repository includes several sample programs that show how to use these resources.
</p>
<ul>
	<li>The fdem programs show a basic airplane flying over the ocean and land (using the applicable modules).</li>
	<li>The fmod programs show detailed airplane models flying over an animated ocean.</li>
	<li>The fsim programs are basic flight simulation which use the flight, grid and ocean simulation modules.</li>
</ul>
<p>
You can run these programs and load these resources using the following syntax:
<pre>https://philcrowther.github.io/Aviation/file_name</pre>

For example: https://philcrowther.github.io/Aviation/fmod_FM2_GPU_ocean_gh.html

NOTE:
When we started this Repo, you could use NodeMaterials with WebGL2. This ended with r165. Effective with r166, you could use NodeMatgerials only with WebGPU. And r167 made significant changes to the three.js WebGPU modules. 
The Ocean3 module works with NodeMaterials and WebGL2 up to r165. The Ocean4 module works with NodMaterials and WebGPU up to r166. The Ocean4a module works with NodeMaterials and WebGPU starting with r167. 
The SunFlare module works with a simple Camera rotator or Orbit Controls. The SunFlare2 modules works with a compound Camera rotator (and not OrbitControls)
Thanks to Attila Schroeder for his encouragement and assistance.
