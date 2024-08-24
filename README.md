<img border="2" src="texture/images/fsim_240824.jpg" height="300" style="float: center">

<h2>My Aviation Resources Repository (rev. 14 Aug 2024)</h2>
<p>
This repository contains aviation-related resources designed to simulate 3D flight in three.js.
</p><p>
This includes a flight simulation module (FlightW3), an ocean simulation module (Ocean3 through Ocean 4a), and a fully animated WWII fighter airplane (FM2).
</p><p>
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

For example: https://philcrowther.github.io/Aviation/fmod_FM2_ocean_gpu_gh.html

NOTE:
<p>
When we started this Repo a few months ago, you could use NodeMaterials with WebGL2. This ended with r165. Effective with r166, you could use NodeMatgerials only with WebGPU. And r167 made significant changes to the three.js WebGPU modules.
</p><p>
The AnimFM2, FlightW3, GrdMap3 SunFlare and SunFlare2 modules should work with both WebGL2 and WebGPU.
</p><p>
The Ocean3 and GrdWtr3 modules work with Standard Materials and WebGL2. The Ocean3 and GrdWtr3N modules work with NodeMaterials and WebGL2 up to r165. The Ocean4 and GrdWtr4 modules work with NodMaterials and WebGPU up to r166. The Ocean4a and GrdWtr4a modules work with NodeMaterials and WebGPU starting with r167. 
</p><p>
Special thanks to Attila Schroeder for his encouragement and assistance in converting everything to NodeMaterials and WebGPU. And to all the volunteers at three.js who took on the daunting task of modifying three.js to work with NodeMaterials and WebGPU.
</p>
