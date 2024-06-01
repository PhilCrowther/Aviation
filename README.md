<h2>An Aviation Resources Repository</h2>
<p>
This repository contains aviation-related resources designed to simulate 3D flight in three.js.<br>
This includes a flight simulation module (Flight3), an ocean simulation module (Ocean3), and a fully animated WWII fighter airplane (FM2).<br>
The repository includes several sample programs that show how to use these resources.
</p>
<ul>
	<li>The fdem programs show a basic airplane flying over the ocean and land (using the applicable modules).</li>
	<li>The fmod programs show detailed airplane models flying over an animated ocean with simple clouds.</li>
	<li>The fsim programs are basic flight simulation which use the flight, grid and ocean simulation modules.</li>
</ul>
<p>
You can run these programs and load these resources using the following syntax:
<pre>https://philcrowther.github.io/Aviation/file_name</pre>

For example: https://philcrowther.github.io/Aviation/fmod_FM2_vc27_ocean_gh.html

NOTE:
The main programs are currently updated to r165, but we have not updated the ocean module to work with WebGPU. Effective with r164, node textures work only with WebGPU. We have gotten around this limitation by using a r163 WebGL legacy file. We hope to shortly update the ocean module to work with WebGPU so that this kludge is not necessary.
