import test from 'node:test';
import assert from 'node:assert/strict';
import { hasProtocolBody, localContentPending, topicCalculatorIds, protocolBlockAnchor, legacyClinicalBlocks } from './protocolContent.js';
const prose = 'Evaluar estado clínico, estabilizar al paciente y coordinar traslado con el centro receptor según gravedad. Registrar hallazgos, intervenciones y respuesta al tratamiento en la ficha clínica.';
test('metadata, PDF, checklist and test stubs do not certify developed local content', () => {
  for (const data of [{}, {protocol_file_url:'https://example.com/file.pdf'}, {protocol_flowchart:[{title:'Hola',description:'Holas'}]}, {content_blocks:[{type:'protocol_header',content:prose}]}, {content_blocks:[{type:'checklist',items:[prose]}]}, {clinical_summary:'Pendiente de completar el protocolo institucional'}]) {
    assert.equal(hasProtocolBody(data),false);assert.equal(localContentPending({...data,has_local_protocol:true}),true);
  }
});
test('both legacy and modern substantive content are recognized without altering the source', () => {
  for (const data of [{clinical_summary:prose}, {protocol_flowchart:[{description:prose}]}, {content_blocks:[{type:'criteria',items:[prose]}]}]) {const copy=JSON.stringify(data);assert.equal(hasProtocolBody(data),true);assert.equal(JSON.stringify(data),copy);}
});
test('calculator links survive renames and allow explicit metadata', () => {
  assert.deepEqual(topicCalculatorIds({id:'696efee3e40fc675b3e7bc69',name:'Nombre nuevo'}),['sri']);
  assert.deepEqual(topicCalculatorIds({id:'other',name:'Secuencia Rápida de Intubación'}),[]);
  assert.deepEqual(topicCalculatorIds({related_tools:[{tool_id:'renal-function',embedded:true}]}),['renal-function']);
  assert.notEqual(protocolBlockAnchor({},0),protocolBlockAnchor({},1));
});

test('legacy fields remain visible through a lossless read adapter', () => {
  const topic = {clinical_summary:prose,initial_treatment:'Primera línea\nSegunda línea',complementary_studies:''};
  const before = JSON.stringify(topic);const blocks = legacyClinicalBlocks(topic);
  assert.equal(blocks.length,2);assert.equal(blocks[0].content,prose);
  assert.equal(blocks[1].content,topic.initial_treatment);assert.equal(JSON.stringify(topic),before);
});
