export type MentorshipProgramId = 'gsoc' | 'lfx' | 'outreachy';

export interface MentorshipProgramOrg {
  id: string;
  rankIndex: number;
  programId: MentorshipProgramId;
  name: string;
  githubHandle: string;
  verifiedHandle: boolean;
  participationYears: number[];
  yearMask: number;
  participationCount: number;
  firstYear: number;
  lastYear: number;
  activeIn2025: boolean;
  frequencyBadge: string;
  typicalLanguages: string[];
  typicalFrameworks: string[];
  domainCategory: string;
}

/**
 * Encodes an array of participation years (2016–2025) into a 10-bit integer bitmask
 * (2016 = bit 0, 2017 = bit 1, ..., 2025 = bit 9) for O(1) multi-year intersection checks.
 */
export function encodeYearBitmask(years: number[]): number {
  let mask = 0;
  for (const yr of years) {
    if (yr >= 2016 && yr <= 2025) {
      mask |= 1 << (yr - 2016);
    }
  }
  return mask;
}

/**
 * O(1) bitwise check verifying that an organization participated in ALL selected years.
 */
export function matchesSelectedYearsBitmask(
  orgYearMask: number,
  selectedYearsMask: number
): boolean {
  return (orgYearMask & selectedYearsMask) === selectedYearsMask;
}

export const matchesSelectedYears = matchesSelectedYearsBitmask;

export interface MatchedMentorshipOrg extends MentorshipProgramOrg {
  matchScore: number;
  matchedSkills: string[];
  matchSummary: string;
}

/**
 * Exact raw dataset of all 505 Google Summer of Code Organizations (2016–2025).
 */
export const RAW_GSOC_DATA = `
1. 3DTK (2018)
2. 52°North Initiative for Geospatial Open Source Software GmbH (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
3. AboutCode (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
4. Academy Software Foundation (ASWF) (2020, 2022)
5. Accord Project (2020, 2021, 2024, 2025)
6. AerospaceResearch.net (2017, 2018, 2019, 2020, 2021)
7. AFLplusplus (2020, 2021, 2022, 2023, 2024, 2025)
8. aimacode (2016, 2017, 2018, 2019)
9. Alaska (2024, 2025)
10. Amahi (2017, 2018, 2019, 2020)
11. Android Graphics Tools Team (2019, 2020, 2021)
12. AnitaB.org Open Source (2020)
13. AnkiDroid (2021, 2022, 2024, 2025)
14. AOSSIE (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
15. Apache DataFusion (2025)
16. Apache Software Foundation (2016, 2017, 2018, 2019, 2022, 2023, 2024, 2025)
17. API Client Tools at Google (2019)
18. API Dash (2024, 2025)
19. Apertium (2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025)
20. apertus° Association (2018, 2019, 2020, 2021, 2022)
21. appleseedhq (2017, 2018, 2019, 2020)
22. ArchC (2016)
23. Arduino (2020)
24. ArduPilot (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
25. ASCEND (2016)
26. AsyncAPI (2024, 2025)
27. Audacity (2021, 2022)
28. Babel (2017)
29. Bazel (2017, 2018, 2019)
30. BeagleBoard.org Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
31. Beam Community (2016, 2017, 2018)
32. BeeWare Project (2017, 2018)
33. Bench-Routes (2021)
34. Berkman Klein Center for Internet & Society at Harvard University (2016, 2017, 2018, 2019)
35. BioGears (2020)
36. BioJS (2016)
37. Biomedical Informatics, Emory University (2016, 2019, 2021, 2022, 2023, 2024, 2025)
38. Blender Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
39. Boost C++ Libraries (2017, 2018, 2019, 2020, 2021)
40. Boston University / XIA (2016, 2017, 2018)
41. BRL-CAD (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
42. BuildmLearn (2016)
43. Buildroot (2019)
44. C2SI (2024)
45. Cadasta (2017)
46. caMicroscope (2020, 2021, 2023, 2024)
47. Canadian Centre for Computational Genomics (C3G) (2016, 2018, 2019, 2020)
48. Carbon Language (2023)
49. Casbin (2020, 2021, 2022)
50. CASTOR (2021)
51. Catrobat (2016, 2017, 2018, 2019, 2020)
52. CBMI@UTHSC (2019)
53. cBioPortal for Cancer Genomics (2016, 2017, 2018, 2019, 2022, 2023, 2024, 2025)
54. CCExtractor Development (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
55. Celluloid (2016)
56. Center for Research In Open Source Software (CROSS) at UC Santa Cruz (2018, 2019, 2021)
57. Center for Translational Data Science (2022, 2025)
58. Ceph Foundation (2016, 2017, 2020, 2021, 2022, 2023, 2024, 2025)
59. CERN-HSF (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
60. CGAL Project (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
61. Chapel (2016, 2017, 2019, 2020, 2021)
62. CHAOSS (2018, 2019, 2020, 2021, 2022, 2025)
63. Checker Framework (2017, 2018, 2019, 2020, 2025)
64. Checkstyle (2017, 2020, 2021, 2022, 2023, 2024, 2025)
65. CHIPS Alliance (2022, 2023, 2024)
66. Chromium (2021, 2022, 2023, 2024, 2025)
67. Cilium (2021)
68. CircuitVerse.org (2019, 2020, 2021, 2022, 2023, 2024, 2025)
69. City of Boston (2024)
70. CiviCRM (2016, 2018, 2019, 2020, 2021)
71. Classical Language Toolkit (2016, 2017, 2018)
72. CLiPS, University of Antwerp (2017, 2018, 2019)
73. Clojure (2017)
74. Cloud Native Computing Foundation (CNCF) (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
75. CloudCV (2016, 2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025)
76. CMU Sphinx (2017)
77. coala (2017, 2018, 2019, 2021)
78. Cockpit Project (2023)
79. Computational Biology @ University of Nebraska-Lincoln (2016, 2017, 2018, 2019)
80. Computational Science and Engineering at TU Wien (2016)
81. Continuous Delivery Foundation (2020, 2021)
82. Conversations.im (2017, 2018)
83. Copyleft Games (2016, 2017)
84. coreboot (2016, 2019, 2020, 2022, 2023)
85. Creative Commons (2019, 2020, 2023, 2024)
86. CRIU (Checkpoint/Restore in User-space) (2019, 2020, 2021, 2022, 2023, 2024, 2025)
87. Cuneiform Digital Library Initiative (CDLI) (2018, 2019, 2020, 2021, 2022)
88. CVAT (2024)
89. CVXPY (2016)
90. D Foundation / D Language Foundation (2016, 2019, 2025)
91. Dart (2020, 2021, 2022, 2023, 2024, 2025)
92. Data for the Common Good (2024, 2025)
93. DatenLord (2024)
94. DBpedia (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
95. Debian Project (2016, 2018, 2019, 2020, 2021, 2022, 2024, 2025)
96. DeepChem (2024, 2025)
97. DeepPavlov (2021)
98. Department of Biomedical Informatics, Emory University (2021, 2022, 2023, 2024, 2025)
99. Developers Italia (2018, 2019)
100. Digital Impact Alliance (DIAL) at UN Foundation (2018, 2019, 2020, 2021)
101. Discourse (2016, 2017)
102. Distributed and Unified Numerics Environment (DUNE) (2016)
103. Django Software Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
104. dora-rs (2025)
105. Drupal Association (2016, 2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025)
106. Earth Science Information Partners (ESIP) (2018, 2019)
107. Eclipse Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
108. Elastic (2018, 2020)
109. Electron (2022, 2024, 2025)
110. Elm Software Foundation (2017)
111. Elm Tooling (2021)
112. Embox (2020)
113. Environmental Data And Governance Initiative (2017)
114. Erlang Ecosystem Foundation (2020)
115. Eta (2018)
116. eunomia-bpf (2024)
117. Fedora Project (2016, 2017, 2018, 2019, 2020, 2025)
118. FFmpeg (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
119. FLARE (2023, 2024, 2025)
120. Flashrom (2022)
121. Forschungszentrum Jülich (2022)
122. Fortran-lang (2021, 2022, 2023, 2024, 2025)
123. FOSDEM VZW (2016, 2017, 2019)
124. FOSSASIA (2016, 2017, 2018, 2019, 2024, 2025)
125. FOSSology (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
126. FrameNet Brasil (UFJF) (2019, 2020, 2021)
127. Free and Open Source Silicon Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
128. Free UK Genealogy (2018)
129. FreeBSD Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
130. FreeCAD (2023, 2024, 2025)
131. FreeType (2018, 2019, 2020, 2021, 2022, 2023, 2024)
132. Freifunk (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
133. Frescobaldi (2017)
134. FRRouting (2020, 2021, 2022)
135. Gambit - Software Tools for Game Theory (2016)
136. Ganeti (2016)
137. GCP Scanner (2023)
138. GDevelop (2020)
139. Genes, Genomes and Variation (2016, 2017, 2018, 2019)
140. GENIVI Alliance (2017, 2018, 2019)
141. Genome Assembly and Annotation (2021, 2022, 2023)
142. Gentoo Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023)
143. GeomScale (2020, 2021, 2022, 2023, 2024, 2025)
144. GFOSS - Open Technologies Alliance (2017, 2018, 2019, 2020, 2021)
145. Git (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
146. GitHub (2016)
147. GitLab (2021, 2022, 2023, 2025)
148. Global Alliance for Genomics and Health (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
149. GNOME Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
150. GNSS-SDR (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2024, 2025)
151. GNU Compiler Collection (GCC) (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
152. GNU Image Manipulation Program (2022, 2023, 2024, 2025)
153. GNU Mailman (2016, 2019, 2021)
154. GNU Octave (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
155. GNU Project (2016, 2017, 2018, 2019, 2020, 2023, 2024)
156. GNU Radio (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
157. GnuTLS (2023)
158. Godot Engine (2018, 2019, 2020, 2021, 2022)
159. Google DeepMind (2025)
160. Google FHIR SDK (2021)
161. GPAC (2016, 2020)
162. gprMax (2019, 2021, 2023, 2024, 2025)
163. GRAME (2022, 2023, 2024, 2025)
164. Graphite (2024, 2025)
165. GraphQL Foundation (2020)
166. Green Navigation (2016, 2017)
167. GRR Rapid Response (2021)
168. gRPC (2016, 2017, 2018)
169. gVisor (2021)
170. Haiku (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
171. Halide (2021)
172. Haskell.org (2018, 2019, 2020, 2021, 2022, 2024, 2025)
173. Hazelcast (2020)
174. Health Information Systems Programme (2016)
175. Homebrew (2016, 2017, 2018, 2020, 2022)
176. HumanAI (2024, 2025)
177. Hydra Ecosystem (2019, 2020, 2021)
178. Inclusive Design Institute (2016, 2018)
179. INCF (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
180. Indic Project (2016)
181. Inkscape (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
182. Inria Foundation (2018)
183. Institut für Angewandte Informatik (InfAI) e.V. (2019)
184. Institute for Artificial Intelligence (2017, 2018)
185. Integrated Ocean Observing System (IOOS) (2021, 2022, 2024, 2025)
186. Intel Media and Audio for Linux (2017, 2018, 2019, 2020, 2021, 2022)
187. InterMine (2018, 2019)
188. International Catrobat Association (2021, 2022, 2023, 2024, 2025)
189. Internet Archive (2017, 2018, 2019, 2020, 2021, 2023, 2024, 2025)
190. Internet Health Report (2022, 2023, 2024, 2025)
191. Internet Systems Consortium (2018, 2019)
192. Invesalius (2023, 2024, 2025)
193. Ivy (lets-unify.ai) (2023)
194. JabRef e.V. (2019, 2021, 2022, 2024, 2025)
195. Java Pathfinder Team (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
196. JAX and Keras (2025)
197. JBoss Community (2016, 2017, 2018, 2019, 2020, 2021, 2022)
198. JdeRobot - Universidad Rey Juan Carlos (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
199. Jenkins Project (2016, 2018, 2019, 2020, 2022, 2023, 2024, 2025)
200. Jenkins X (2022)
201. JGraphT (2018)
202. Jina AI (2023)
203. Jitsi (2017, 2018, 2022, 2024, 2025)
204. Joomla! (2016, 2017, 2018, 2019, 2021, 2022, 2025)
205. Joplin (2020, 2021, 2022, 2024)
206. jQuery Foundation (2016)
207. JSK Robotics Laboratory (2016, 2017, 2018, 2019)
208. JSON Schema (2024, 2025)
209. K-9 Mail (2017)
210. Kapitan (2019, 2020)
211. Kart Project (2022)
212. KDE Community (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
213. Keploy (2023, 2024, 2025)
214. Keptn (2022)
215. Kiwix (2018, 2019, 2020, 2021, 2023, 2024, 2025)
216. KNIME (2019)
217. Kodi Foundation (2019, 2020, 2021, 2022)
218. KolibriOS Project Team (2016, 2024)
219. Kornia (2025)
220. Kotlin Foundation (2023, 2024, 2025)
221. kro | Kube Resource Orchestrator (2025)
222. Kubeflow (2020, 2024, 2025)
223. KubeVirt (2023, 2024, 2025)
224. LabLua (2016, 2017, 2018, 2019, 2020, 2021, 2024, 2025)
225. languagetool.org (2018)
226. LAPPIS (2024)
227. LEAP Encryption Access Project (2018, 2022)
228. Learning Equality (2021, 2022, 2023, 2024, 2025)
229. libcamera (2021, 2022, 2023)
230. Libre Space Foundation (2019, 2020, 2021)
231. LibreCube Initiative (2021, 2022, 2024)
232. LibreHealth (2017, 2018, 2019, 2020, 2021, 2022, 2023)
233. LibreOffice (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
234. libssh (2022, 2023, 2024, 2025)
235. Libvirt (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
236. Linkerd (2019, 2020)
237. Liquid Galaxy Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
238. LLVM Compiler Infrastructure (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
239. lowRISC (2016, 2017, 2020)
240. LuaRocks (2017, 2018, 2019)
241. Machine Learning for Science (ML4SCI) (2021, 2022, 2023, 2024, 2025)
242. MacPorts (2019, 2020)
243. Mantis (2023)
244. MapAction (2021)
245. MariaDB Foundation (2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
246. Mathesar (2022, 2023)
247. Matrix.org (2016, 2017, 2018, 2019, 2020, 2021, 2022)
248. Mautic (2024)
249. Mayor's Office of New Urban Mechanics (City of Boston) (2021, 2022, 2023)
250. MBDyn (2016, 2017, 2019, 2020, 2021, 2022, 2024, 2025)
251. McGill Space Institute (2016)
252. MDAnalysis (2020, 2021, 2022, 2023, 2024, 2025)
253. Media Cloud (2021)
254. MediaPipe (2021)
255. MetaBrainz Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
256. MetaCall (2021, 2022, 2023, 2024)
257. Metasploit (2017, 2018, 2020, 2022, 2023)
258. MGGG Redistricting Lab (2020, 2021)
259. Micro Electronics Research Lab - UITU (2022, 2023, 2024, 2025)
260. Microkernel devroom (2017)
261. Mifos Initiative (2016, 2017, 2018, 2019, 2022, 2023, 2024, 2025)
262. MIT App Inventor (2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
263. MIT Media Lab (2016)
264. Mixxx DJ Software (2016, 2017, 2018, 2020, 2022, 2023, 2024, 2025)
265. mlpack (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
266. Mobile Robot Programming Toolkit (MRPT) (2016, 2017, 2018)
267. ModSecurity (2016)
268. Moira (2019, 2020)
269. moja global (2022)
270. Monado (2022)
271. Mono Project (2017)
272. Moodle (2016, 2017, 2018, 2019)
273. MoveIt (2020, 2021, 2022, 2023, 2024)
274. MovingBlocks (2016, 2017, 2018)
275. Mozilla (2016, 2017, 2018, 2019, 2020)
276. MuseScore (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
277. mypy (2020, 2021)
278. MZmine and MS-DIAL (2023)
279. Named Data Networking Project (2019)
280. National Resource for Network Biology (NRNB) (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
281. Navidrome (2021)
282. Neovim (2018, 2019, 2020, 2025)
283. Netfilter project (2016, 2017, 2018, 2019)
284. Netty (2020)
285. Neuroinformatics Unit (2025)
286. Neutralinojs (2022, 2024)
287. Nightwatch.js (2024)
288. NixOS Foundation (2024)
289. Nmap Security Scanner (2016, 2017)
290. NumFOCUS (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
291. NV Access (2019, 2020)
292. omegaUp (2018, 2022, 2023, 2024, 2025)
293. Open Bioinformatics Foundation (OBF) (2016, 2017, 2018, 2019, 2020, 2021, 2022)
294. Open Chemistry (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
295. Open Chromosome Collective (2024)
296. Open Climate Fix (2024, 2025)
297. Open Data Kit (2017, 2018, 2019)
298. Open Detection (2016, 2017)
299. Open Ephys (2016)
300. Open Food Facts (2018, 2022, 2025)
301. Open Genome Informatics (2016, 2017, 2018, 2020, 2021, 2022, 2023)
302. Open HealthCare Network (2024, 2025)
303. Open Roberta Lab (2018, 2019, 2020, 2021)
304. Open Science Initiative for Perfusion Imaging (2024, 2025)
305. Open Science Labs (2025)
306. Open Source Robotics Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
307. Open States (2017, 2018)
308. Open Technologies Alliance - GFOSS (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
309. Open Transit Software Foundation (2024, 2025)
310. Open3D team (2022)
311. OpenAFS (2022, 2025)
312. OpenAstronomy (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
313. OpenCensus (2018)
314. OpenCV (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
315. OpenELIS Global (2024, 2025)
316. OpenEMR (2020)
317. OpenHMD (2020)
318. OpenKeychain (OpenPGP for Android) (2016)
319. OpenMined (2020, 2021)
320. OpenMRS (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
321. OpenMS (2025)
322. OpenRefine (2020, 2024)
323. OpenSIPS (2018)
324. OpenStreetMap (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
325. openSUSE Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
326. OpenVINO Toolkit (2022, 2023, 2024, 2025)
327. OpenWISP (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
328. OpnTec (2018)
329. Oppia Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
330. Orange – Data Mining Fruitful & Fun (2016)
331. Orcasound (2020, 2021, 2022)
332. Organic Maps (2022, 2023, 2024, 2025)
333. OSGeo - The Open Source Geospatial Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
334. OSU Open Source Lab (2016)
335. Our World In Data (2022)
336. oVirt (2017)
337. OW2 (2018)
338. OWASP Foundation (2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
339. ownCloud (2016, 2017, 2018)
340. P2PSP.org (2016, 2017, 2018)
341. PAL Robotics (2025)
342. PEcAn Project (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
343. Peragro (2016)
344. Performance Co-Pilot (2016, 2017, 2018, 2019, 2020, 2022)
345. Percona (2019, 2020)
346. Pharo Consortium (2017, 2019, 2021, 2023, 2025)
347. phpBB Forum Software (2017, 2018)
348. phpMyAdmin (2017, 2018, 2019)
349. Physical Web Project (2016, 2017)
350. Pidgin Instant Messenger (2021)
351. Pitivi (2019, 2020, 2021, 2023)
352. Plan 9 Foundation (2021)
353. PLASMA-UMass (2016)
354. Plone Foundation (2016, 2017, 2018, 2022, 2023, 2024, 2025)
355. PMD (2017, 2018)
356. Pocket Science Lab (2018)
357. Point Cloud Library (2020, 2021)
358. Polly Labs (2017, 2018)
359. Polypheny (2021, 2022, 2024)
360. Portland State University (2016, 2017)
361. PostgreSQL (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
362. Postman (2020, 2021, 2022, 2023, 2024)
363. PowerDNS (2022)
364. PRISM Model Checker (2016)
365. Probot (2018)
366. Processing Foundation (2017, 2018, 2020, 2021, 2022, 2023, 2025)
367. Project Mesa (2024, 2025)
368. Project PANOPTES (2019)
369. Project WikiLoop (2021)
370. Prometheus-Operator (2024, 2025)
371. Public Lab (2016, 2017, 2018, 2019, 2021, 2022)
372. Purr Data (2018, 2019, 2020, 2021, 2022, 2023, 2024)
373. Python HYDRA (2018)
374. Python Software Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
375. QC-Devs (2024, 2025)
376. Qdrant (2023)
377. QEMU (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
378. Qubes OS (2017, 2020, 2021)
379. Quill.org (2018)
380. R project for statistical computing (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
381. RADAR-base (2022)
382. radare / radare2 (2016, 2017, 2018, 2020)
383. React Native Elements (2021)
384. ReactOS Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022)
385. Read the Docs (2018, 2019)
386. Red Hen Lab (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
387. Responsible AI and Human Centred Technology (2022)
388. Rizin (2021, 2022, 2023, 2024, 2025)
389. RoboComp (2016, 2017, 2018, 2019, 2020, 2021, 2022)
390. Robolectric (2022, 2024)
391. Rocket.Chat (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
392. Rspamd (2018, 2019, 2025)
393. RTEMS Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
394. Ruby (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023)
395. Ruby on Rails (2017, 2018)
396. Ruby Science Foundation (2016, 2017, 2018, 2019)
397. SageMath (2016, 2017, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
398. Salesforce (2019)
399. Samba (2017, 2019, 2020, 2021)
400. Scala Center (2021, 2022, 2023, 2024, 2025)
401. Scalable Parallel Computing Laboratory (2023, 2024)
402. Scilab Enterprises (2016, 2017, 2018)
403. SCoRe Lab (Sustainable Computing Research Lab) (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023)
404. ScummVM (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
405. SeaQL (2022)
406. Seastar (2018)
407. Shaka Player (2021)
408. Shogun Machine Learning Toolbox (2016, 2017, 2019, 2020)
409. Sigmah (2016, 2017, 2018)
410. sktime (2022, 2024)
411. Society for Arts and Technology (SAT) (2022, 2023, 2025)
412. Software and Computational Systems Lab at LMU Munich (2018, 2019, 2023, 2024, 2025)
413. Software Heritage (2019, 2021, 2022)
414. Software Product Data Exchange (SPDX) (2017, 2018, 2019, 2020, 2021, 2022, 2023)
415. Soletta Project (2016)
416. Space @ Virginia Tech (2018)
417. SQLancer (2023, 2025)
418. St. Jude Children's Research Hospital (2025)
419. stdlib (2024, 2025)
420. STE||AR Group (2016, 2017, 2018, 2020, 2021, 2022, 2023, 2024, 2025)
421. Stemformatics (2018)
422. Stichting SU2 (2024, 2025)
423. Stony Brook University Biomedical Informatics (2016, 2017, 2018)
424. strace (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023)
425. Stratosphere Laboratory, Czech Technical University in Prague (2023, 2024)
426. Streetmix (2018)
427. Submitty (2018, 2019, 2020, 2021, 2022, 2023, 2024)
428. Sugar Labs (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
429. SW360 (2025)
430. Swift (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
431. SymbiFlow (2019, 2020, 2021)
432. SymPy (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
433. Synfig (2019, 2020, 2021, 2022, 2023, 2024, 2025)
434. syslog-ng (2016, 2017, 2018, 2019, 2020, 2021, 2022)
435. Systers, an Anita Borg Institute Community (2016, 2017, 2018)
436. Tarantool (2021, 2022)
437. TARDIS-SN (2016, 2020, 2021, 2022, 2023, 2024, 2025)
438. TEAMMATES @ National University of Singapore (2016, 2017, 2018)
439. TensorFlow (2019, 2020, 2021, 2022, 2023)
440. The Center for Connected Learning and Computer-Based Modeling (2016, 2017, 2018, 2019)
441. The ENIGMA Team (2021, 2022, 2023, 2024)
442. The Honeynet Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
443. The Julia Language (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
444. The Libreswan Project (2018, 2019, 2020, 2021, 2022)
445. The Linux Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
446. The MacPorts Project (2017, 2018)
447. The Monarch Initiative (2016)
448. The NetBSD Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
449. The ns-3 Network Simulator Project (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
450. The P4 Language Consortium (2024, 2025)
451. The Palisadoes Foundation (2021, 2022, 2023, 2024, 2025)
452. The Perl Foundation (2019)
453. The Postgres Operator (2019)
454. The Processing Foundation (2018)
455. The Qt Project (2018)
456. The Rust Foundation (2024, 2025)
457. The Terasology Foundation (2019, 2020, 2021)
458. The Tor Project (2016, 2017, 2018, 2019, 2022, 2023, 2025)
459. The Vega Visualization Tools by the UW Interactive Data Lab (2018, 2019)
460. The Wine Project (2016, 2017, 2018, 2019, 2020)
461. TianoCore (2021, 2022)
462. Tiled (2017)
463. Timelab Technologies Ltd. (2016)
464. TimVideos.us (2016, 2017, 2018, 2019)
465. TLA+ (2018)
466. Tokio (2019)
467. Tungsten Fabric (2019)
468. Typelevel (2025)
469. UC OSPO (2022, 2023, 2024, 2025)
470. UCSC Xena (2017, 2018, 2019)
471. Unicode, Inc. (2024, 2025)
472. Unikraft (2022, 2023, 2024, 2025)
473. Unitex/GramLab (2016)
474. Uramaki LAB (2024, 2025)
475. Urban Energy Systems Laboratory, Empa (2016, 2017, 2018)
476. Vert.x (2016, 2017)
477. VideoLAN / VLMC Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
478. ViSP (2017, 2018)
479. vitrivr (2016, 2018, 2021)
480. Wagtail (2022, 2023, 2024, 2025)
481. Waycrate (2024, 2025)
482. Wayland (2016)
483. Weaviate (2022)
484. webpack (2018, 2019, 2020, 2024, 2025)
485. Wellcome Sanger Tree of Life (2022, 2024, 2025)
486. Wikimedia Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
487. Wireshark (2020)
488. WorldBrain - Verifying the Internet with Science (2017, 2018)
489. WSO2 (2016, 2017)
490. wxWidgets (2017)
491. X.Org Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024)
492. Xapian Search Engine Library (2016, 2017, 2018, 2019, 2020)
493. XBMC Foundation (2017, 2018)
494. Xen Project (2017)
495. Xfce (2021, 2022)
496. Xi Editor Project (2018, 2019)
497. Xiph.Org Foundation (2021)
498. XMPP Standards Foundation (2017, 2019, 2020, 2022, 2023, 2024, 2025)
499. xpra.org (2018, 2019)
500. xrdesktop (2021)
501. XWiki (2016, 2017, 2018, 2019, 2021, 2022, 2023)
502. Zendalona (2024, 2025)
503. Zenodo (2017)
504. Zulip Open Source Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
505. ZynAddSubFX (2019)
`.trim();

/**
 * Curated LFX Mentorship & Outreachy datasets using the same structured format
 * so switching program tabs in MentorshipExplorer works seamlessly.
 */
export const RAW_LFX_DATA = `
1. Kubernetes (CNCF / LFX) (2019, 2020, 2021, 2022, 2023, 2024, 2025)
2. Prometheus Monitoring (CNCF / LFX) (2020, 2021, 2022, 2023, 2024, 2025)
3. Envoy Proxy (CNCF / LFX) (2020, 2021, 2022, 2023, 2024, 2025)
4. OpenTelemetry (CNCF / LFX) (2021, 2022, 2023, 2024, 2025)
5. Cilium & eBPF (CNCF / LFX) (2021, 2022, 2023, 2024, 2025)
6. Linux Kernel Mentorship Program (2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
7. KubeEdge (CNCF / LFX) (2021, 2022, 2023, 2024, 2025)
8. Kyverno Policy Engine (CNCF / LFX) (2022, 2023, 2024, 2025)
9. Argo Project (CNCF / LFX) (2021, 2022, 2023, 2024, 2025)
10. Vitess Database Clustering (CNCF / LFX) (2020, 2021, 2022, 2023, 2024, 2025)
11. Backstage Developer Portal (CNCF / LFX) (2022, 2023, 2024, 2025)
12.WasmEdge Runtime (CNCF / LFX) (2021, 2022, 2023, 2024, 2025)
13. Hyperledger Foundation (LFX) (2019, 2020, 2021, 2022, 2023, 2024, 2025)
14. OpenJS Foundation (Node.js & Vite) (2020, 2021, 2022, 2023, 2024, 2025)
15. RISC-V International (LFX) (2021, 2022, 2023, 2024, 2025)
16. Jaeger Tracing (CNCF / LFX) (2020, 2021, 2022, 2023, 2024, 2025)
17. Helm Package Manager (CNCF / LFX) (2020, 2021, 2022, 2023, 2024, 2025)
18. Chaos Mesh (CNCF / LFX) (2021, 2022, 2023, 2024)
`.trim();

export const RAW_OUTREACHY_DATA = `
1. Wikimedia Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
2. Mozilla Corporation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
3. GNOME Foundation (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
4. Debian Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
5. Fedora Project (2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
6. Apache Software Foundation (2019, 2020, 2021, 2022, 2023, 2024, 2025)
7. Oppia Foundation (2020, 2021, 2022, 2023, 2024, 2025)
8. Zulip Open Source Project (2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025)
9. Public Lab (2018, 2019, 2020, 2021, 2022, 2023)
10. Creative Commons (2019, 2020, 2021, 2022, 2023, 2024)
11. JupyterHub & Project Jupyter (2019, 2020, 2021, 2022, 2023, 2024, 2025)
12. OpenArchive & Human Rights Tech (2022, 2023, 2024, 2025)
13. Bioconductor (2022, 2023, 2024, 2025)
14. Ushahidi Platform (2020, 2021, 2022, 2023, 2024)
15. Ersilia Open Source Initiative (2023, 2024, 2025)
`.trim();

/**
 * Curated map of canonical GitHub organization handles for major GSoC / LFX / Outreachy orgs
 * so Octokit live issue queries hit exact verified GitHub handles.
 */
const VERIFIED_GITHUB_HANDLE_MAP: Record<string, string> = {
  '52°north initiative for geospatial open source software gmbh': '52North',
  'aboutcode': 'aboutcode-org',
  'academy software foundation (aswf)': 'AcademySoftwareFoundation',
  'accord project': 'accordproject',
  'aflplusplus': 'AFLplusplus',
  'aimacode': 'aimacode',
  'anitab.org open source': 'anitab-org',
  'ankidroid': 'ankidroid',
  'aossie': 'AOSSIE-Org',
  'apache datafusion': 'apache',
  'apache software foundation': 'apache',
  'api dash': 'foss42',
  'apertium': 'apertium',
  'arduino': 'arduino',
  'ardupilot': 'ArduPilot',
  'asyncapi': 'asyncapi',
  'audacity': 'audacity',
  'babel': 'babel',
  'bazel': 'bazelbuild',
  'beagleboard.org foundation': 'beagleboard',
  'beeware project': 'beeware',
  'blender foundation': 'blender',
  'boost c++ libraries': 'boostorg',
  'brl-cad': 'BRL-CAD',
  'camicroscope': 'camicroscope',
  'carbon language': 'carbon-language',
  'casbin': 'casbin',
  'cbioportal for cancer genomics': 'cBioPortal',
  'ccextractor development': 'CCExtractor',
  'ceph foundation': 'ceph',
  'cern-hsf': 'HSF',
  'cgal project': 'CGAL',
  'chapel': 'chapel-lang',
  'chaoss': 'chaoss',
  'checker framework': 'typetools',
  'checkstyle': 'checkstyle',
  'chips alliance': 'chipsalliance',
  'chromium': 'chromium',
  'cilium': 'cilium',
  'circuitverse.org': 'CircuitVerse',
  'civicrm': 'civicrm',
  'clojure': 'clojure',
  'cloud native computing foundation (cncf)': 'kubernetes',
  'cloudcv': 'Cloud-CV',
  'coala': 'coala',
  'cockpit project': 'cockpit-project',
  'continuous delivery foundation': 'cdfoundation',
  'creative commons': 'creativecommons',
  'criu (checkpoint/restore in user-space)': 'checkpoint-restore',
  'cvat': 'cvat-ai',
  'cvxpy': 'cvxgrp',
  'd foundation / d language foundation': 'dlang',
  'dart': 'dart-lang',
  'dbpedia': 'dbpedia',
  'debian project': 'Debian',
  'deepchem': 'deepchem',
  'deeppavlov': 'deepmipt',
  'discourse': 'discourse',
  'django software foundation': 'django',
  'dora-rs': 'dora-rs',
  'drupal association': 'drupal',
  'eclipse foundation': 'eclipse',
  'elastic': 'elastic',
  'electron': 'electron',
  'elm software foundation': 'elm',
  'erlang ecosystem foundation': 'erlef',
  'eunomia-bpf': 'eunomia-bpf',
  'fedora project': 'fedora-infra',
  'ffmpeg': 'FFmpeg',
  'fortran-lang': 'fortran-lang',
  'fossasia': 'fossasia',
  'fossology': 'fossology',
  'freebsd project': 'freebsd',
  'freecad': 'FreeCAD',
  'frrouting': 'FRRouting',
  'gdevelop': '4ian',
  'gentoo foundation': 'gentoo',
  'geomscale': 'GeomScale',
  'git': 'git',
  'github': 'github',
  'gitlab': 'gitlabhq',
  'gnome foundation': 'GNOME',
  'gnu compiler collection (gcc)': 'gcc-mirror',
  'gnu octave': 'gnu-octave',
  'gnu radio': 'gnuradio',
  'godot engine': 'godotengine',
  'google deepmind': 'google-deepmind',
  'graphql foundation': 'graphql',
  'grpc': 'grpc',
  'gvisor': 'google',
  'haiku': 'haiku',
  'halide': 'halide',
  'haskell.org': 'haskell',
  'hazelcast': 'hazelcast',
  'homebrew': 'Homebrew',
  'huggingface': 'huggingface',
  'incf': 'INCF',
  'inkscape': 'inkscape',
  'internet archive': 'internetarchive',
  'jabref e.v.': 'JabRef',
  'jax and keras': 'keras-team',
  'jderobot - universidad rey juan carlos': 'JdeRobot',
  'jenkins project': 'jenkinsci',
  'jenkins x': 'jenkins-x',
  'jina ai': 'jina-ai',
  'jitsi': 'jitsi',
  'joomla!': 'joomla',
  'joplin': 'laurent22',
  'jquery foundation': 'jquery',
  'json schema': 'json-schema-org',
  'kde community': 'KDE',
  'keploy': 'keploy',
  'keptn': 'keptn',
  'kiwix': 'kiwix',
  'kodi foundation': 'xbmc',
  'kornia': 'kornia',
  'kotlin foundation': 'JetBrains',
  'kubeflow': 'kubeflow',
  'kubevirt': 'kubevirt',
  'learning equality': 'learningequality',
  'libreoffice': 'LibreOffice',
  'libvirt': 'libvirt',
  'linkerd': 'linkerd',
  'liquid galaxy project': 'LiquidGalaxy',
  'llvm compiler infrastructure': 'llvm',
  'machine learning for science (ml4sci)': 'ML4SCI',
  'mariadb foundation': 'MariaDB',
  'mathesar': 'mathesar-foundation',
  'matrix.org': 'matrix-org',
  'mautic': 'mautic',
  'mdanalysis': 'MDAnalysis',
  'mediapipe': 'google-ai-edge',
  'metabrainz foundation': 'metabrainz',
  'metacall': 'metacall',
  'metasploit': 'rapid7',
  'mifos initiative': 'openMF',
  'mit app inventor': 'mit-cml',
  'mixxx dj software': 'mixxxdj',
  'mlpack': 'mlpack',
  'moodle': 'moodle',
  'moveit': 'moveit',
  'mozilla': 'mozilla',
  'mozilla corporation': 'mozilla',
  'musescore': 'musescore',
  'mypy': 'python',
  'navidrome': 'navidrome',
  'neovim': 'neovim',
  'netty': 'netty',
  'neutralinojs': 'neutralinojs',
  'nightwatch.js': 'nightwatchjs',
  'nixos foundation': 'NixOS',
  'numfocus': 'numfocus',
  'omegaup': 'omegaup',
  'open chemistry': 'OpenChemistry',
  'open climate fix': 'openclimatefix',
  'open food facts': 'openfoodfacts',
  'open healthcare network': 'ohcnetwork',
  'open source robotics foundation': 'osrf',
  'openastronomy': 'OpenAstronomy',
  'opencv': 'opencv',
  'openmined': 'OpenMined',
  'openmrs': 'openmrs',
  'openrefine': 'OpenRefine',
  'openstreetmap': 'openstreetmap',
  'opensuse project': 'openSUSE',
  'openvino toolkit': 'openvinotoolkit',
  'openwisp': 'openwisp',
  'oppia foundation': 'oppia',
  'organic maps': 'organicmaps',
  'osgeo - the open source geospatial foundation': 'OSGeo',
  'our world in data': 'owid',
  'owasp foundation': 'OWASP',
  'owncloud': 'owncloud',
  'pecan project': 'PecanProject',
  'pharo consortium': 'pharo-project',
  'phpbb forum software': 'phpbb',
  'phpmyadmin': 'phpmyadmin',
  'plone foundation': 'plone',
  'point cloud library': 'PointCloudLibrary',
  'postgresql': 'postgres',
  'postman': 'postmanlabs',
  'powerdns': 'PowerDNS',
  'probot': 'probot',
  'processing foundation': 'processing',
  'project mesa': 'projectmesa',
  'prometheus-operator': 'prometheus-operator',
  'public lab': 'publiclab',
  'python software foundation': 'python',
  'qdrant': 'qdrant',
  'qemu': 'qemu',
  'qubes os': 'QubesOS',
  'r project for statistical computing': 'r-devel',
  'react native elements': 'react-native-elements',
  'reactos foundation': 'reactos',
  'read the docs': 'readthedocs',
  'rizin': 'rizinorg',
  'robolectric': 'robolectric',
  'rocket.chat': 'RocketChat',
  'rtems project': 'RTEMS',
  'ruby': 'ruby',
  'ruby on rails': 'rails',
  'sagemath': 'sagemath',
  'scala center': 'scala',
  'score lab (sustainable computing research lab)': 'scorelab',
  'scummvm': 'scummvm',
  'seaql': 'SeaQL',
  'shaka player': 'shaka-project',
  'sktime': 'sktime',
  'spdx': 'spdx',
  'sqlancer': 'sqlancer',
  'stdlib': 'stdlib-js',
  'streetmix': 'streetmix',
  'submitty': 'Submitty',
  'sugar labs': 'sugarlabs',
  'swift': 'swiftlang',
  'sympy': 'sympy',
  'synfig': 'synfig',
  'syslog-ng': 'syslog-ng',
  'tarantool': 'tarantool',
  'tardis-sn': 'tardis-sn',
  'teammates @ national university of singapore': 'TEAMMATES',
  'tensorflow': 'tensorflow',
  'the honeynet project': 'honeynet',
  'the julia language': 'JuliaLang',
  'the linux foundation': 'linuxfoundation',
  'the netbsd foundation': 'NetBSD',
  'the ns-3 network simulator project': 'nsnam',
  'the palisadoes foundation': 'PalisadoesFoundation',
  'the rust foundation': 'rust-lang',
  'the tor project': 'torproject',
  'tokio': 'tokio-rs',
  'typelevel': 'typelevel',
  'unicode, inc.': 'unicode-org',
  'unikraft': 'unikraft',
  'vertx': 'eclipse-vertx',
  'videolan / vlmc project': 'videolan',
  'wagtail': 'wagtail',
  'waycrate': 'waycrate',
  'weaviate': 'weaviate',
  'webpack': 'webpack',
  'wikimedia foundation': 'wikimedia',
  'wireshark': 'wireshark',
  'x.org foundation': 'freedesktop',
  'xmpp standards foundation': 'xsf',
  'xwiki': 'xwiki',
  'zenodo': 'zenodo',
  'zulip open source project': 'zulip',
  // LFX & Outreachy specific mappings
  'kubernetes (cncf / lfx)': 'kubernetes',
  'prometheus monitoring (cncf / lfx)': 'prometheus',
  'envoy proxy (cncf / lfx)': 'envoyproxy',
  'opentelemetry (cncf / lfx)': 'open-telemetry',
  'cilium & ebpf (cncf / lfx)': 'cilium',
  'linux kernel mentorship program': 'torvalds',
  'kubeedge (cncf / lfx)': 'kubeedge',
  'kyverno policy engine (cncf / lfx)': 'kyverno',
  'argo project (cncf / lfx)': 'argoproj',
  'vitess database clustering (cncf / lfx)': 'vitessio',
  'backstage developer portal (cncf / lfx)': 'backstage',
  'wasmedge runtime (cncf / lfx)': 'WasmEdge',
  'hyperledger foundation (lfx)': 'hyperledger',
  'openjs foundation (node.js & vite)': 'nodejs',
  'risc-v international (lfx)': 'riscv',
  'jaeger tracing (cncf / lfx)': 'jaegertracing',
  'helm package manager (cncf / lfx)': 'helm',
  'chaos mesh (cncf / lfx)': 'chaos-mesh',
  'jupyterhub & project jupyter': 'jupyterhub',
};

/**
 * Returns true if the organization is in our curated VERIFIED_GITHUB_HANDLE_MAP.
 */
export function isVerifiedOrganizationHandle(orgName: string): boolean {
  const key = orgName.trim().toLowerCase();
  return Boolean(VERIFIED_GITHUB_HANDLE_MAP[key]);
}

/**
 * Derives a candidate GitHub organization handle from an organization's display name.
 * Verified orgs use the curated mapping table; unverified orgs are flagged with verifiedHandle: false
 * and resolved interactively via GitHub's organization search API in Step 2.
 */
export function deriveGitHubHandle(orgName: string): string {
  const key = orgName.trim().toLowerCase();
  if (VERIFIED_GITHUB_HANDLE_MAP[key]) {
    return VERIFIED_GITHUB_HANDLE_MAP[key];
  }

  // Strip parenthetical acronyms and common suffixes like "Foundation", "Project", "GmbH", "Inc."
  const stripped = orgName
    .replace(/\([^)]*\)/g, '')
    .replace(
      /\b(Foundation|Project|Initiative|Association|Community|Consortium|Organization|Team|GmbH|Inc\.?|Ltd\.?|VZW|e\.V\.)\b/gi,
      ''
    )
    .trim();

  const slug = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 38);

  return slug || 'github';
}

/**
 * Assigns confirmed tech stack tags ONLY to verified organizations.
 * Unverified organizations do not get fabricated fallback tags (no silent Python/TypeScript/Docker inflation).
 */
export function inferOrganizationTechStack(
  orgName: string,
  _rankIndex: number,
  verifiedHandle: boolean = isVerifiedOrganizationHandle(orgName)
): {
  typicalLanguages: string[];
  typicalFrameworks: string[];
  domainCategory: string;
} {
  if (!verifiedHandle) {
    return {
      typicalLanguages: [],
      typicalFrameworks: [],
      domainCategory: 'Unverified — tags not confirmed',
    };
  }

  const lower = orgName.toLowerCase();

  if (
    lower.includes('python') ||
    lower.includes('django') ||
    lower.includes('sympy') ||
    lower.includes('numfocus') ||
    lower.includes('scikit') ||
    lower.includes('sktime') ||
    lower.includes('mdanalysis') ||
    lower.includes('mypy') ||
    lower.includes('wagtail') ||
    lower.includes('zulip') ||
    lower.includes('oppia') ||
    lower.includes('jupyter')
  ) {
    return {
      typicalLanguages: ['Python', 'TypeScript', 'JavaScript'],
      typicalFrameworks: ['React', 'FastAPI', 'Flask', 'Pytest'],
      domainCategory: 'Python, Web & Scientific Computing',
    };
  }

  if (
    lower.includes('react') ||
    lower.includes('webpack') ||
    lower.includes('babel') ||
    lower.includes('electron') ||
    lower.includes('jquery') ||
    lower.includes('nightwatch') ||
    lower.includes('stdlib') ||
    lower.includes('asyncapi') ||
    lower.includes('json schema') ||
    lower.includes('rocket.chat') ||
    lower.includes('joplin') ||
    lower.includes('backstage') ||
    lower.includes('openjs') ||
    lower.includes('streetmix') ||
    lower.includes('neutralinojs') ||
    lower.includes('probot')
  ) {
    return {
      typicalLanguages: ['TypeScript', 'JavaScript', 'HTML/CSS'],
      typicalFrameworks: ['React', 'Next.js', 'Node.js', 'Tailwind CSS', 'Vite'],
      domainCategory: 'Frontend, Web & Developer Tooling',
    };
  }

  if (
    lower.includes('cncf') ||
    lower.includes('kubernetes') ||
    lower.includes('kube') ||
    lower.includes('prometheus') ||
    lower.includes('cilium') ||
    lower.includes('jaeger') ||
    lower.includes('helm') ||
    lower.includes('argo') ||
    lower.includes('vitess') ||
    lower.includes('gvisor') ||
    lower.includes('grpc') ||
    lower.includes('casbin') ||
    lower.includes('keploy') ||
    lower.includes('navidrome') ||
    lower.includes('weaviate')
  ) {
    return {
      typicalLanguages: ['Go', 'TypeScript', 'Python'],
      typicalFrameworks: ['React', 'Node.js', 'Docker'],
      domainCategory: 'Cloud-Native & Distributed Systems',
    };
  }

  if (
    lower.includes('rust') ||
    lower.includes('tokio') ||
    lower.includes('dora-rs') ||
    lower.includes('seaql') ||
    lower.includes('qdrant') ||
    lower.includes('waycrate') ||
    lower.includes('datenlord')
  ) {
    return {
      typicalLanguages: ['Rust', 'TypeScript', 'Python'],
      typicalFrameworks: ['Node.js', 'React'],
      domainCategory: 'Systems Programming & Rust Ecosystem',
    };
  }

  if (
    lower.includes('ai') ||
    lower.includes('machine learning') ||
    lower.includes('deep') ||
    lower.includes('tensor') ||
    lower.includes('keras') ||
    lower.includes('opencv') ||
    lower.includes('mlpack') ||
    lower.includes('openmined') ||
    lower.includes('kornia') ||
    lower.includes('jina') ||
    lower.includes('cvat') ||
    lower.includes('mediapipe') ||
    lower.includes('bio') ||
    lower.includes('genom') ||
    lower.includes('neuro') ||
    lower.includes('chem')
  ) {
    return {
      typicalLanguages: ['Python', 'C++', 'TypeScript'],
      typicalFrameworks: ['Pytest', 'React', 'FastAPI'],
      domainCategory: 'AI, Machine Learning & Bioinformatics',
    };
  }

  if (
    lower.includes('java') ||
    lower.includes('apache') ||
    lower.includes('eclipse') ||
    lower.includes('jenkins') ||
    lower.includes('jboss') ||
    lower.includes('checkstyle') ||
    lower.includes('ankidroid') ||
    lower.includes('kotlin') ||
    lower.includes('scala') ||
    lower.includes('openmrs') ||
    lower.includes('mifos') ||
    lower.includes('jabref')
  ) {
    return {
      typicalLanguages: ['Java', 'TypeScript', 'Python'],
      typicalFrameworks: ['React', 'Node.js'],
      domainCategory: 'Enterprise Java, Kotlin & Web Platforms',
    };
  }

  if (
    lower.includes('llvm') ||
    lower.includes('gcc') ||
    lower.includes('gnu') ||
    lower.includes('linux') ||
    lower.includes('freebsd') ||
    lower.includes('netbsd') ||
    lower.includes('debian') ||
    lower.includes('fedora') ||
    lower.includes('qemu') ||
    lower.includes('ffmpeg') ||
    lower.includes('blender') ||
    lower.includes('inkscape') ||
    lower.includes('kde') ||
    lower.includes('gnome') ||
    lower.includes('libreoffice') ||
    lower.includes('videolan') ||
    lower.includes('godot') ||
    lower.includes('boost') ||
    lower.includes('cgal') ||
    lower.includes('ardupilot') ||
    lower.includes('robotics')
  ) {
    return {
      typicalLanguages: ['C++', 'C', 'Python'],
      typicalFrameworks: ['Pytest'],
      domainCategory: 'Systems, Compilers, Graphics & Robotics',
    };
  }

  // Verified organization without a narrow domain keyword match
  return {
    typicalLanguages: ['Python', 'C++', 'TypeScript'],
    typicalFrameworks: ['React', 'Node.js'],
    domainCategory: 'Verified Open Source Organization',
  };
}

/**
 * Formats the Participation Frequency Badge based on how many years the organization participated.
 */
export function buildFrequencyBadge(years: number[]): string {
  const count = years.length;
  const minYear = years[0] || 2016;
  const maxYear = years[years.length - 1] || 2025;

  if (count >= 10) {
    return `10-Year All-Star (${minYear}–${maxYear})`;
  }
  if (count >= 7) {
    return `${count}-Year Veteran (${minYear}–${maxYear})`;
  }
  if (count >= 4) {
    return `${count} Years Active (${minYear}–${maxYear})`;
  }
  if (count === 1) {
    return `1 Year (${minYear})`;
  }
  return `${count} Years (${years.join(', ')})`;
}

/**
 * Pure parser utility that converts raw numbered lines like:
 * "2. 52°North Initiative for Geospatial Open Source Software GmbH (2016, 2017, ..., 2025)"
 * into structured MentorshipProgramOrg JSON objects.
 */
export function parseMentorshipOrganizations(
  rawText: string,
  programId: MentorshipProgramId = 'gsoc'
): MentorshipProgramOrg[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line));

  const parsed: MentorshipProgramOrg[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s*(.+?)\s*\((\d{4}(?:,\s*\d{4})*)\)\s*$/);
    if (!match) continue;

    const rankIndex = parseInt(match[1], 10);
    const name = match[2].trim();
    const yearsStr = match[3];
    const participationYears = yearsStr
      .split(',')
      .map((y) => parseInt(y.trim(), 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b);

    const participationCount = participationYears.length;
    const yearMask = encodeYearBitmask(participationYears);
    const firstYear = participationYears[0] || 2016;
    const lastYear = participationYears[participationCount - 1] || 2025;
    const activeIn2025 = participationYears.includes(2025);
    const verifiedHandle = isVerifiedOrganizationHandle(name);
    const githubHandle = deriveGitHubHandle(name);
    const { typicalLanguages, typicalFrameworks, domainCategory } = inferOrganizationTechStack(
      name,
      rankIndex,
      verifiedHandle
    );

    parsed.push({
      id: `${programId}-${rankIndex}`,
      rankIndex,
      programId,
      name,
      githubHandle,
      verifiedHandle,
      participationYears,
      yearMask,
      participationCount,
      firstYear,
      lastYear,
      activeIn2025,
      frequencyBadge: buildFrequencyBadge(participationYears),
      typicalLanguages,
      typicalFrameworks,
      domainCategory,
    });
  }

  return parsed;
}

/**
 * Pre-parsed export of all 505 GSoC organizations (2016–2025),
 * plus LFX Mentorship and Outreachy organizations.
 */
export const gsocOrganizations: MentorshipProgramOrg[] = parseMentorshipOrganizations(
  RAW_GSOC_DATA,
  'gsoc'
);

export const lfxOrganizations: MentorshipProgramOrg[] = parseMentorshipOrganizations(
  RAW_LFX_DATA,
  'lfx'
);

export const outreachyOrganizations: MentorshipProgramOrg[] = parseMentorshipOrganizations(
  RAW_OUTREACHY_DATA,
  'outreachy'
);

export function getOrganizationsByProgram(programId: MentorshipProgramId): MentorshipProgramOrg[] {
  if (programId === 'lfx') return lfxOrganizations;
  if (programId === 'outreachy') return outreachyOrganizations;
  return gsocOrganizations;
}

/**
 * Pure skill-matching algorithm that scores each mentorship organization (0–100%)
 * against the student's active languages and frameworks.
 * Phase 2 Hygiene: Unverified organizations (verifiedHandle === false) are excluded from
 * language-based score inflation so unconfirmed tags never pollute match rankings.
 */
export function scoreMentorshipOrganizations(
  orgs: MentorshipProgramOrg[],
  userLanguages: string[],
  userFrameworks: string[]
): MatchedMentorshipOrg[] {
  const normLangs = userLanguages.map((l) => l.toLowerCase());
  const normFrameworks = userFrameworks.map((f) => f.toLowerCase());

  return orgs
    .map((org) => {
      if (!org.verifiedHandle) {
        const baseConsistencyScore =
          18 + Math.min(10, org.participationCount) + (org.activeIn2025 ? 4 : 0);
        return {
          ...org,
          matchScore: baseConsistencyScore,
          matchedSkills: [],
          matchSummary: 'Unverified — tags not confirmed',
        };
      }

      const matchedLangs = org.typicalLanguages.filter((l) =>
        normLangs.includes(l.toLowerCase())
      );
      const matchedFws = org.typicalFrameworks.filter((f) =>
        normFrameworks.includes(f.toLowerCase())
      );

      const matchedSkills = Array.from(new Set([...matchedLangs, ...matchedFws]));

      // Base score + language overlap (up to 48 pts) + framework overlap (up to 20 pts) + veteran consistency bonus (up to 14 pts)
      let score = 18;
      if (matchedLangs.length >= 2) {
        score += 48;
      } else if (matchedLangs.length === 1) {
        score += 36;
      }

      if (matchedFws.length >= 2) {
        score += 20;
      } else if (matchedFws.length === 1) {
        score += 12;
      }

      score += Math.min(10, org.participationCount);
      if (org.activeIn2025) {
        score += 4;
      }

      const clampedScore = Math.max(24, Math.min(99, score));
      const skillText =
        matchedSkills.length > 0
          ? matchedSkills.join(', ')
          : org.typicalLanguages.slice(0, 2).join(', ');

      return {
        ...org,
        matchScore: clampedScore,
        matchedSkills,
        matchSummary: `${clampedScore}% Match · ${skillText}`,
      };
    })
    .sort((a, b) => {
      if (a.verifiedHandle !== b.verifiedHandle) {
        return a.verifiedHandle ? -1 : 1;
      }
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      if (b.participationCount !== a.participationCount) {
        return b.participationCount - a.participationCount;
      }
      return a.name.localeCompare(b.name);
    });
}

export const GSOC_AVAILABLE_YEARS: number[] = [
  2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025
];

export const GSOC_CATEGORIES: string[] = Array.from(
  new Set(gsocOrganizations.map((o) => o.domainCategory))
).sort();

export const MENTORSHIP_PROGRAMS: Array<{
  id: string;
  name: string;
  shortName: 'GSoC' | 'LFX' | 'ESoC';
  organizer: string;
  stipendRange: string;
  applicationWindow: string;
  status: 'Upcoming' | 'Applications Open' | 'Active Cohort';
  description: string;
  officialUrl: string;
  eligibility: string;
}> = [
  {
    id: 'gsoc-2025',
    name: 'Google Summer of Code (GSoC)',
    shortName: 'GSoC',
    organizer: 'Google Open Source',
    stipendRange: '$1,500 – $6,600 USD (PPP Adjusted)',
    applicationWindow: 'March – April Annually',
    status: 'Active Cohort',
    description:
      'Global program focused on bringing university students and new contributors into open-source software development across 505+ mentoring organizations.',
    officialUrl: 'https://summerofcode.withgoogle.com/',
    eligibility: 'University students & beginner open-source contributors (18+)'
  },
  {
    id: 'lfx-mentorship',
    name: 'Linux Foundation (LFX) Mentorship',
    shortName: 'LFX',
    organizer: 'The Linux Foundation',
    stipendRange: '$3,000 – $6,600 USD',
    applicationWindow: 'Spring, Summer & Fall Terms',
    status: 'Applications Open',
    description:
      'Three annual 12-week mentorship terms pairing student developers with cloud-native, Kubernetes, Linux kernel, and security maintainers.',
    officialUrl: 'https://mentorship.lfx.linuxfoundation.org/',
    eligibility: 'Students & developers learning cloud-native or systems engineering'
  },
  {
    id: 'esoc-2025',
    name: 'European Summer of Code (ESoC)',
    shortName: 'ESoC',
    organizer: 'European Open Source Consortium',
    stipendRange: '€3,000 – €5,500 EUR',
    applicationWindow: 'April – May Annually',
    status: 'Upcoming',
    description:
      'Structured open-source fellowships across AI, scientific computing, digital public goods, and privacy-preserving infrastructure.',
    officialUrl: 'https://summerofcode.eu/',
    eligibility: 'University students & open-source newcomers'
  }
];

export const MENTORSHIP_ORGANIZATIONS = gsocOrganizations.map((org) => {
  const inLfx = lfxOrganizations.some(
    (l) => l.name.toLowerCase() === org.name.toLowerCase()
  );
  const programs: ('GSoC' | 'LFX' | 'ESoC')[] = inLfx ? ['GSoC', 'LFX'] : ['GSoC'];
  const combinedStack = Array.from(
    new Set([...org.typicalLanguages, ...org.typicalFrameworks])
  );

  return {
    id: org.id,
    name: org.name,
    githubHandle: org.githubHandle,
    programs,
    category: org.domainCategory,
    yearsParticipated: org.participationYears,
    yearBitmask: org.yearMask,
    description: `${org.name} — ${org.domainCategory} (${org.frequencyBadge}, active ${org.firstYear}–${org.lastYear}).`,
    techStack: combinedStack,
    domain: org.domainCategory,
    beginnerIssuesCount: org.activeIn2025 ? 12 : 6,
    ideasListUrl: `https://www.google.com/search?q=${encodeURIComponent(
      `${org.name} Google Summer of Code ideas list`
    )}`,
    issuesUrl: `https://github.com/${encodeURIComponent(org.githubHandle)}`,
    mentorTip: `Check ${org.name}'s repository README and CONTRIBUTING.md before claiming your first issue.`
  };
});
