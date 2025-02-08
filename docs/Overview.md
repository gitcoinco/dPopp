<mxfile host="app.diagrams.net" modified="2023-12-04T15:12:58.580Z" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" etag="dJXTrn722bQGsytig8Q4" version="22.1.5" type="github">
  <diagram name="Page-1" id="l0reTKrWUvADZwfx3ytK">
    <mxGraphModel dx="2799" dy="1877" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="0mZUsYWy7sKT-thT9O5G-4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-3" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-6" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-5" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-37" value="&amp;nbsp;write to blockchain&amp;nbsp;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="0mZUsYWy7sKT-thT9O5G-6" vertex="1" connectable="0">
          <mxGeometry x="-0.6989" y="1" relative="1" as="geometry">
            <mxPoint y="1" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-14" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-12" edge="1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="570" y="238" />
              <mxPoint x="705" y="238" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-36" value="&amp;nbsp;store new VCs&amp;nbsp;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="0mZUsYWy7sKT-thT9O5G-14" vertex="1" connectable="0">
          <mxGeometry x="0.1508" y="-3" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-15" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-13" edge="1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="575" y="965" />
              <mxPoint x="975" y="965" />
            </Array>
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-38" value="&amp;nbsp; write to compose db&amp;nbsp; (not yet implemented but planned)&amp;nbsp; &amp;nbsp;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="0mZUsYWy7sKT-thT9O5G-15" vertex="1" connectable="0">
          <mxGeometry x="0.3876" y="-1" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-2" value="Passport App" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#76608a;strokeColor=#432D57;fontColor=#ffffff;" parent="1" vertex="1">
          <mxGeometry x="460" y="472.5" width="230" height="90" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-3" value="Gitcoin Passport" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#b0e3e6;strokeColor=#0e8088;" parent="1" vertex="1">
          <mxGeometry x="965" y="492.5" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-5" value="Passport Score" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#b0e3e6;strokeColor=#0e8088;" parent="1" vertex="1">
          <mxGeometry x="965" y="652.5" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-9" value="EAS" style="swimlane;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" parent="1" vertex="1">
          <mxGeometry x="825" y="352.5" width="460" height="400" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-13" value="EAS is am optional storage.&lt;br&gt;Users need to explicitly push to EAS, select the chain, pay the gas fees.&lt;br&gt;The format on EAS is optimised for lower gas (binary encoded)." style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1;" parent="0mZUsYWy7sKT-thT9O5G-9" vertex="1">
          <mxGeometry x="140" y="40" width="290" height="80" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-10" value="Ceramic / Compose DB" style="swimlane;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;" parent="1" vertex="1">
          <mxGeometry x="825" y="792.5" width="460" height="710" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-13" value="Stamp VC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="150" y="130" width="230" height="90" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-16" value="Passport Score" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6d0de;gradientColor=#d5739d;strokeColor=#996185;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="150" y="420" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-20" value="EAS Passport" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6d0de;gradientColor=#d5739d;strokeColor=#996185;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="150" y="510" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-14" value="Ceramic will be used as a secondary storage.&lt;br&gt;Writing to ceramic will be automatic, and will be triggered after writing to DB.&lt;br&gt;The format is the same as in the DB." style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="160" y="40" width="230" height="80" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-15" value="&lt;b&gt;&lt;i&gt;- not yet implemented -&amp;nbsp;&lt;/i&gt;&lt;/b&gt;&lt;br&gt;Here we would store the same attestation (same format) as on EAS.&lt;br&gt;This has the same disadvantages as the on-chain EAS attestations, meaning they are cryptic.&lt;br&gt;But would have the advantage to be validated on-chain (EIP-712)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="160" y="250" width="300" height="140" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-22" value="Stamp VC / Attestation" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6d0de;gradientColor=#d5739d;strokeColor=#996185;" parent="0mZUsYWy7sKT-thT9O5G-10" vertex="1">
          <mxGeometry x="150" y="600" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-11" value="DB" style="swimlane;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;" parent="1" vertex="1">
          <mxGeometry x="825" y="62.5" width="460" height="260" as="geometry" />
        </mxCell>
        <mxCell id="0mZUsYWy7sKT-thT9O5G-12" value="Stamp VC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;" parent="0mZUsYWy7sKT-thT9O5G-11" vertex="1">
          <mxGeometry x="104" y="130" width="230" height="90" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-12" value="The DB is the primary storage. All VCs get stored by default here." style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;spacingRight=4;overflow=hidden;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;rotatable=0;whiteSpace=wrap;html=1;" parent="0mZUsYWy7sKT-thT9O5G-11" vertex="1">
          <mxGeometry x="104" y="60" width="230" height="55" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-28" value="DB" style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;" parent="0mZUsYWy7sKT-thT9O5G-11" vertex="1">
          <mxGeometry x="15" y="35" width="45" height="55" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-1" value="Stamp VC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;" parent="1" vertex="1">
          <mxGeometry x="1530" y="62.5" width="230" height="90" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-2" value="&lt;h1&gt;&lt;span style=&quot;background-color: initial;&quot;&gt;Gitcoin Passport VC&lt;/span&gt;&lt;/h1&gt;&lt;h1&gt;See specification and examples here:&amp;nbsp;&lt;/h1&gt;https://www.w3.org/TR/vc-data-model-2.0/#concrete-lifecycle-example&lt;br&gt;&lt;br&gt;&lt;ul&gt;&lt;li&gt;only 1 VC is represented&lt;/li&gt;&lt;li&gt;this a clean JSON format, follows the specification&lt;/li&gt;&lt;li&gt;the plan is to move to another proof type (EIP-712 compatible)&lt;/li&gt;&lt;/ul&gt;&lt;pre&gt;&lt;br&gt;{&lt;br&gt;  &quot;type&quot;: [&quot;VerifiableCredential&quot;],&lt;br&gt;  &quot;proof&quot;: {&lt;br&gt;    &quot;jws&quot;: &quot;eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..QmkRxxdZi2kp2RSOgyXnsvHpCrCaYN8lAQGlNXn9SgaI17etjouxeIB55EOTlyiq_soUecY2bzwWV3y-3SaICQ&quot;,&lt;br&gt;    &quot;type&quot;: &quot;Ed25519Signature2018&quot;,&lt;br&gt;    &quot;created&quot;: &quot;2023-10-03T21:17:13.544Z&quot;,&lt;br&gt;    &quot;proofPurpose&quot;: &quot;assertionMethod&quot;,&lt;br&gt;    &quot;verificationMethod&quot;: &quot;did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC#z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC&quot;&lt;br&gt;  },&lt;br&gt;  &quot;issuer&quot;: &quot;did:key:z6MkghvGHLobLEdj1bgRLhS4LPGJAvbMA1tn2zcRyqmYU5LC&quot;,&lt;br&gt;  &quot;@context&quot;: [&quot;https://www.w3.org/2018/credentials/v1&quot;],&lt;br&gt;  &quot;issuanceDate&quot;: &quot;2023-10-03T21:17:13.544Z&quot;,&lt;br&gt;  &quot;expirationDate&quot;: &quot;2024-01-01T21:17:13.544Z&quot;,&lt;br&gt;  &quot;credentialSubject&quot;: {&lt;br&gt;    &quot;id&quot;: &quot;did:pkh:eip155:1:0x85fF01cfF157199527528788ec4eA6336615C989&quot;,&lt;br&gt;    &quot;hash&quot;: &quot;v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=&quot;,&lt;br&gt;    &quot;@context&quot;: [&lt;br&gt;      {&lt;br&gt;        &quot;hash&quot;: &quot;https://schema.org/Text&quot;,&lt;br&gt;        &quot;provider&quot;: &quot;https://schema.org/Text&quot;&lt;br&gt;      }&lt;br&gt;    ],&lt;br&gt;    &quot;provider&quot;: &quot;GitcoinContributorStatistics#numGrantsContributeToGte#1&quot;&lt;br&gt;  }&lt;br&gt;}&lt;/pre&gt;" style="text;html=1;strokeColor=none;fillColor=none;spacing=5;spacingTop=-20;whiteSpace=wrap;overflow=hidden;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="1810" y="20" width="590" height="580" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-3" value="Gitcoin&amp;nbsp;Passport" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#b0e3e6;strokeColor=#0e8088;" parent="1" vertex="1">
          <mxGeometry x="1520" y="680" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-4" value="&lt;h1&gt;Gitcoin Passport (EAS schema)&lt;/h1&gt;&lt;p&gt;&lt;/p&gt;&lt;ul&gt;&lt;li&gt;multiple VCs, binary encoding&lt;/li&gt;&lt;li&gt;t&lt;span style=&quot;background-color: initial;&quot;&gt;his encodes a passport (collection of VCs into a single structure), for writing on-chain&lt;/span&gt;&lt;/li&gt;&lt;li&gt;this is optimised for low-gas on-chain usage&lt;/li&gt;&lt;li&gt;does have an external dependency, providers map&lt;/li&gt;&lt;/ul&gt;&lt;p&gt;&lt;/p&gt;&lt;p&gt;Below is an &lt;b&gt;off-chain&lt;/b&gt;&amp;nbsp;&lt;span style=&quot;background-color: initial;&quot;&gt;example of such attestation in off-chain&amp;nbsp;&lt;/span&gt;&lt;/p&gt;&lt;pre&gt;{&lt;br&gt;  &quot;sig&quot;: {&lt;br&gt;    &quot;domain&quot;: {&lt;br&gt;      &quot;name&quot;: &quot;EAS Attestation&quot;,&lt;br&gt;      &quot;version&quot;: &quot;0.26&quot;,&lt;br&gt;      &quot;chainId&quot;: &quot;11155111&quot;,&lt;br&gt;      &quot;verifyingContract&quot;: &quot;0xC2679fBD37d54388Ce493F1DB75320D236e1815e&quot;&lt;br&gt;    },&lt;br&gt;    &quot;primaryType&quot;: &quot;Attest&quot;,&lt;br&gt;    &quot;types&quot;: {&lt;br&gt;      &quot;Attest&quot;: [&lt;br&gt;        { &quot;name&quot;: &quot;version&quot;, &quot;type&quot;: &quot;uint16&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;schema&quot;, &quot;type&quot;: &quot;bytes32&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;recipient&quot;, &quot;type&quot;: &quot;address&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;time&quot;, &quot;type&quot;: &quot;uint64&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;expirationTime&quot;, &quot;type&quot;: &quot;uint64&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;revocable&quot;, &quot;type&quot;: &quot;bool&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;refUID&quot;, &quot;type&quot;: &quot;bytes32&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;data&quot;, &quot;type&quot;: &quot;bytes&quot; }&lt;br&gt;      ]&lt;br&gt;    },&lt;br&gt;    &quot;signature&quot;: {&lt;br&gt;      &quot;r&quot;: &quot;0xe0af643a87f41d8e8fc9b44d759bbe4114477d0a6a040f4187b6939e1ec8d96d&quot;,&lt;br&gt;      &quot;s&quot;: &quot;0x2379506179ea51c7d10104087006a905f15f7fa663ba8dbd959f30bad90b43b8&quot;,&lt;br&gt;      &quot;v&quot;: 28&lt;br&gt;    },&lt;br&gt;    &quot;uid&quot;: &quot;0x1d1e87bcac5e266bafb378c0343a3b05ab1690ad514c75721fbe6988bf22f576&quot;,&lt;br&gt;    &quot;message&quot;: {&lt;br&gt;      &quot;version&quot;: 1,&lt;br&gt;      &quot;schema&quot;: &quot;0xa1a04c1e3a1c884d10c625a1c3a45f14eff8f0e8f4d8d08888d39950bd3d9e33&quot;,&lt;br&gt;      &quot;recipient&quot;: &quot;0x85fF01cfF157199527528788ec4eA6336615C989&quot;,&lt;br&gt;      &quot;time&quot;: &quot;1701677216&quot;,&lt;br&gt;      &quot;expirationTime&quot;: &quot;0&quot;,&lt;br&gt;      &quot;refUID&quot;: &quot;0x0000000000000000000000000000000000000000000000000000000000000000&quot;,&lt;br&gt;      &quot;revocable&quot;: true,&lt;br&gt;      &quot;data&quot;: &quot;0x00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000075bcd15000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000008&quot;,&lt;br&gt;      &quot;nonce&quot;: &quot;0&quot;&lt;br&gt;    }&lt;br&gt;  },&lt;br&gt;  &quot;signer&quot;: &quot;0x85fF01cfF157199527528788ec4eA6336615C989&quot;&lt;br&gt;}&lt;/pre&gt;" style="text;html=1;strokeColor=none;fillColor=none;spacing=5;spacingTop=-20;whiteSpace=wrap;overflow=hidden;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="1830" y="680" width="730" height="810" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-5" value="Passport Score" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#b0e3e6;strokeColor=#0e8088;" parent="1" vertex="1">
          <mxGeometry x="1520" y="1490" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-6" value="&lt;h1&gt;Passport Score (EAS schema)&lt;/h1&gt;&lt;p&gt;&lt;/p&gt;&lt;ul&gt;&lt;li&gt;only stores the humanity score that.a user once had&lt;/li&gt;&lt;/ul&gt;&lt;p&gt;&lt;/p&gt;" style="text;html=1;strokeColor=none;fillColor=none;spacing=5;spacingTop=-20;whiteSpace=wrap;overflow=hidden;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="1830" y="1480" width="730" height="100" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-7" value="Passport Score" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6d0de;gradientColor=#d5739d;strokeColor=#996185;" parent="1" vertex="1">
          <mxGeometry x="1520" y="1630" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-8" value="EAS Passport" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e6d0de;gradientColor=#d5739d;strokeColor=#996185;" parent="1" vertex="1">
          <mxGeometry x="1520" y="1729" width="250" height="70" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-9" value="&lt;h1&gt;&lt;span style=&quot;background-color: initial;&quot;&gt;Gitcoin Passport &amp;amp; Passport Score&lt;/span&gt;&lt;/h1&gt;&lt;div&gt;&lt;span style=&quot;background-color: initial;&quot;&gt;&lt;i&gt;&lt;b&gt;&lt;font style=&quot;font-size: 19px;&quot;&gt;(this is not yet implemented, or planned)&lt;/font&gt;&lt;/b&gt;&lt;/i&gt;&lt;/span&gt;&lt;/div&gt;&lt;h1 style=&quot;font-size: 13px;&quot;&gt;&lt;ul&gt;&lt;li&gt;&lt;span style=&quot;background-color: initial; font-weight: normal;&quot;&gt;would write the off-chain format of the EAS attestations to compose DB&lt;/span&gt;&lt;/li&gt;&lt;li&gt;&lt;span style=&quot;font-weight: normal;&quot;&gt;the encoding of the data would remain (binary encoding, not that read-able as the VC format)&lt;/span&gt;&lt;/li&gt;&lt;li&gt;&lt;span style=&quot;font-weight: normal;&quot;&gt;encodes an entire Passport not individual VCs (encoding individual VCs would actually be &lt;span style=&quot;background-color: initial;&quot;&gt;preferred&lt;/span&gt;&lt;span style=&quot;background-color: initial;&quot;&gt;&amp;nbsp;in most cases for easier handling)&lt;/span&gt;&lt;/span&gt;&lt;/li&gt;&lt;li&gt;&lt;span style=&quot;font-weight: normal;&quot;&gt;&lt;span style=&quot;background-color: initial;&quot;&gt;can also be validated on-chain if required, as this is an EIP-712 signed data structure&lt;/span&gt;&lt;/span&gt;&lt;/li&gt;&lt;/ul&gt;&lt;/h1&gt;&lt;div&gt;&lt;span style=&quot;background-color: initial; font-size: 12px; font-weight: normal;&quot;&gt;Example off-chain passport attestation:&lt;/span&gt;&lt;/div&gt;&lt;pre&gt;{&lt;br&gt;  &quot;sig&quot;: {&lt;br&gt;    &quot;domain&quot;: {&lt;br&gt;      &quot;name&quot;: &quot;EAS Attestation&quot;,&lt;br&gt;      &quot;version&quot;: &quot;0.26&quot;,&lt;br&gt;      &quot;chainId&quot;: &quot;11155111&quot;,&lt;br&gt;      &quot;verifyingContract&quot;: &quot;0xC2679fBD37d54388Ce493F1DB75320D236e1815e&quot;&lt;br&gt;    },&lt;br&gt;    &quot;primaryType&quot;: &quot;Attest&quot;,&lt;br&gt;    &quot;types&quot;: {&lt;br&gt;      &quot;Attest&quot;: [&lt;br&gt;        { &quot;name&quot;: &quot;version&quot;, &quot;type&quot;: &quot;uint16&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;schema&quot;, &quot;type&quot;: &quot;bytes32&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;recipient&quot;, &quot;type&quot;: &quot;address&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;time&quot;, &quot;type&quot;: &quot;uint64&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;expirationTime&quot;, &quot;type&quot;: &quot;uint64&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;revocable&quot;, &quot;type&quot;: &quot;bool&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;refUID&quot;, &quot;type&quot;: &quot;bytes32&quot; },&lt;br&gt;        { &quot;name&quot;: &quot;data&quot;, &quot;type&quot;: &quot;bytes&quot; }&lt;br&gt;      ]&lt;br&gt;    },&lt;br&gt;    &quot;signature&quot;: {&lt;br&gt;      &quot;r&quot;: &quot;0xe0af643a87f41d8e8fc9b44d759bbe4114477d0a6a040f4187b6939e1ec8d96d&quot;,&lt;br&gt;      &quot;s&quot;: &quot;0x2379506179ea51c7d10104087006a905f15f7fa663ba8dbd959f30bad90b43b8&quot;,&lt;br&gt;      &quot;v&quot;: 28&lt;br&gt;    },&lt;br&gt;    &quot;uid&quot;: &quot;0x1d1e87bcac5e266bafb378c0343a3b05ab1690ad514c75721fbe6988bf22f576&quot;,&lt;br&gt;    &quot;message&quot;: {&lt;br&gt;      &quot;version&quot;: 1,&lt;br&gt;      &quot;schema&quot;: &quot;0xa1a04c1e3a1c884d10c625a1c3a45f14eff8f0e8f4d8d08888d39950bd3d9e33&quot;,&lt;br&gt;      &quot;recipient&quot;: &quot;0x85fF01cfF157199527528788ec4eA6336615C989&quot;,&lt;br&gt;      &quot;time&quot;: &quot;1701677216&quot;,&lt;br&gt;      &quot;expirationTime&quot;: &quot;0&quot;,&lt;br&gt;      &quot;refUID&quot;: &quot;0x0000000000000000000000000000000000000000000000000000000000000000&quot;,&lt;br&gt;      &quot;revocable&quot;: true,&lt;br&gt;      &quot;data&quot;: &quot;0x00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000075bcd15000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000070000000000000000000000000000000000000000000000000000000000000008&quot;,&lt;br&gt;      &quot;nonce&quot;: &quot;0&quot;&lt;br&gt;    }&lt;br&gt;  },&lt;br&gt;  &quot;signer&quot;: &quot;0x85fF01cfF157199527528788ec4eA6336615C989&quot;&lt;br&gt;}&lt;/pre&gt;" style="text;html=1;strokeColor=none;fillColor=none;spacing=5;spacingTop=-20;whiteSpace=wrap;overflow=hidden;rounded=0;" parent="1" vertex="1">
          <mxGeometry x="1830" y="1620" width="730" height="810" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-16" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;dashed=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-16" edge="1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="575" y="1245" />
              <mxPoint x="580" y="1245" />
              <mxPoint x="580" y="1248" />
            </Array>
            <mxPoint x="990" y="695" as="sourcePoint" />
            <mxPoint x="1000" y="1255" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-19" value="not implemented / idea ???" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="DXmVTmJjXJRBSEi91Lb1-16" vertex="1" connectable="0">
          <mxGeometry x="0.598" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-17" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;dashed=1;exitX=0.474;exitY=1.044;exitDx=0;exitDy=0;exitPerimeter=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="0mZUsYWy7sKT-thT9O5G-20" edge="1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="575" y="567" />
              <mxPoint x="575" y="1330" />
              <mxPoint x="740" y="1330" />
              <mxPoint x="740" y="1338" />
            </Array>
            <mxPoint x="435" y="580" as="sourcePoint" />
            <mxPoint x="750" y="1255" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-18" value="not implemented / idea ???" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="DXmVTmJjXJRBSEi91Lb1-17" vertex="1" connectable="0">
          <mxGeometry x="0.61" y="2" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-23" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;dashed=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;" parent="1" source="0mZUsYWy7sKT-thT9O5G-2" target="DXmVTmJjXJRBSEi91Lb1-22" edge="1">
          <mxGeometry relative="1" as="geometry">
            <Array as="points">
              <mxPoint x="575" y="1425" />
              <mxPoint x="580" y="1425" />
              <mxPoint x="580" y="1428" />
            </Array>
            <mxPoint x="429" y="584" as="sourcePoint" />
            <mxPoint x="750" y="1345" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-24" value="not implemented / idea ???" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="DXmVTmJjXJRBSEi91Lb1-23" vertex="1" connectable="0">
          <mxGeometry x="0.61" y="2" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-29" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" parent="1" source="DXmVTmJjXJRBSEi91Lb1-28" target="0mZUsYWy7sKT-thT9O5G-2" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-35" value="&amp;nbsp;loads VCs from the DB&amp;nbsp;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="DXmVTmJjXJRBSEi91Lb1-29" vertex="1" connectable="0">
          <mxGeometry x="-0.7197" y="-2" relative="1" as="geometry">
            <mxPoint y="1" as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-31" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0;entryY=0.5;entryDx=0;entryDy=0;" parent="1" source="DXmVTmJjXJRBSEi91Lb1-30" target="0mZUsYWy7sKT-thT9O5G-2" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-34" value="&amp;nbsp;issues new VCs&amp;nbsp;" style="edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];" parent="DXmVTmJjXJRBSEi91Lb1-31" vertex="1" connectable="0">
          <mxGeometry x="-0.7596" relative="1" as="geometry">
            <mxPoint as="offset" />
          </mxGeometry>
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-30" value="IAM service" style="ellipse;shape=cloud;whiteSpace=wrap;html=1;" parent="1" vertex="1">
          <mxGeometry x="10" y="700" width="120" height="80" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-32" value="Stamp VC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;" parent="1" vertex="1">
          <mxGeometry x="220" y="602.5" width="126" height="50" as="geometry" />
        </mxCell>
        <mxCell id="DXmVTmJjXJRBSEi91Lb1-33" value="Stamp VC" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d0cee2;strokeColor=#56517e;" parent="1" vertex="1">
          <mxGeometry x="370" y="152.5" width="126" height="50" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
