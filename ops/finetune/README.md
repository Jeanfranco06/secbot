# Fine-tuning del clasificador

## Flujo
1. Exportar dataset: `python -m scripts.export_training` → `/tmp/classifier_train.jsonl`
2. Fine-tuning LoRA con Unsloth (offline):
   - Base: `meta-llama/Llama-3.2-3B-Instruct`
   - r=16, alpha=32, lr=2e-4, epochs=3
3. Convertir a GGUF q4_K_M:
   - `python llama.cpp/convert_hf_to_gguf.py ./output --outfile classifier.gguf --outtype q4_K_M`
4. Crear Modelfile: