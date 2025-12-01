flowchart TD
  A[0.0.70a<br>Zone Skeleton] --> B[0.0.70b<br>World Map Generation]
  B --> C[0.0.70c<br>Static Zone Content]

  C --> D1[0.0.70d1<br>Event Engine + Weather]
  D1 --> D2[0.0.70d2<br>Encounter Events]
  D2 --> D3[0.0.70d3<br>World Flavor Events]

  C --> E1[0.0.70e1<br>Resource Inspect]
  E1 --> E2[0.0.70e2<br>Harvest + Depletion]
  E2 --> E3[0.0.70e3<br>Respawn System]

  C --> F1[0.0.70f1<br>Static Entity Behavior]
  F1 --> F2[0.0.70f2<br>Roaming Entities]

  C --> G[0.0.70g<br>Location Exploration]

  C --> H1[0.0.70h1<br>POI Framework]
  H1 --> H2[0.0.70h2<br>Advanced POIs]

  C --> I[0.0.70i<br>Difficulty Integration]

  C --> J1[0.0.70j1<br>World Map Persistence]
  J1 --> J2[0.0.70j2<br>Zone Internals Persistence]
  J2 --> J3[0.0.70j3<br>Timers & Events Persistence]
  J3 --> K[0.0.70k<br>Polish & Dev Tools]
