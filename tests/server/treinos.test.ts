import { eq } from "drizzle-orm";
import { expect, it } from "vitest";

import { db } from "@/db";
import { exercicio, projetoAtualTroca, projeto, treino } from "@/db/schema";
import {
  EXERCICIOS_INICIAIS,
  type ModeloValido,
  type TreinoValido,
} from "@/domain/treinos";
import { projetoEmFoco } from "@/server/projetos";
import {
  criarExercicio,
  excluirModelo,
  excluirTreino,
  exercicioUsado,
  exerciciosDoUsuario,
  gravarModelo,
  gravarTreino,
  historicoDoExercicio,
  renomearExercicio,
  semearExercicios,
  treinoDoUsuario,
  treinosDoUsuario,
} from "@/server/treinos";

import { comBanco, d, novoUsuario } from "./banco";

async function novoExercicio(usuarioId: string, nome: string) {
  const r = await criarExercicio(db(), usuarioId, nome);
  if (!r.ok) throw new Error(r.erro);
  return r.exercicio.id;
}

function sessao(
  data: string,
  exercicios: TreinoValido["exercicios"],
  modeloId: string | null = null,
): TreinoValido {
  return { nome: null, data: d(data), observacao: null, modeloId, exercicios };
}

const s = (repeticoes: number, cargaKg: number | null = null) => ({
  repeticoes,
  cargaKg,
  observacao: null,
});

async function registrar(usuarioId: string, t: TreinoValido, id?: string) {
  const r = await db().transaction((tx) =>
    gravarTreino(tx, usuarioId, t, id ?? null),
  );
  if (!r) throw new Error("não gravou");
  return r;
}

comBanco("treinos no banco", () => {
  it("bloqueia nome repetido e devolve o existente, desarquivado", async () => {
    const u = await novoUsuario("2026-10-19");
    const id = await novoExercicio(u, "Supino Reto");
    await db()
      .update(exercicio)
      .set({ arquivadoEm: new Date() })
      .where(eq(exercicio.id, id));

    const r = await criarExercicio(db(), u, "  supino   reto ");
    expect(r).toMatchObject({ ok: true, jaExistia: true });
    expect(r.ok && r.exercicio).toEqual({
      id,
      nome: "Supino Reto",
      grupo: null,
      arquivado: false,
    });
    // Parecido não é igual.
    await novoExercicio(u, "Supino");
    expect((await exerciciosDoUsuario(u)).map((e) => e.nome)).toEqual([
      "Supino",
      "Supino Reto",
    ]);
    expect(await renomearExercicio(u, id, "SUPINO")).toBe(
      "Já existe um exercício com esse nome.",
    );
  });

  it("histórico por exercício junta as sessões, da mais recente", async () => {
    const u = await novoUsuario("2026-10-19");
    const supino = await novoExercicio(u, "Supino");
    const flexao = await novoExercicio(u, "Flexão");
    await registrar(
      u,
      sessao("2026-07-03", [
        { exercicioId: supino, series: [s(10, 38), s(8, 38)] },
      ]),
    );
    const t2 = await registrar(
      u,
      sessao("2026-07-10", [
        { exercicioId: flexao, series: [s(15), s(12)] },
        { exercicioId: supino, series: [s(10, 40), s(9, 40), s(8, 37.5)] },
      ]),
    );

    const h = await historicoDoExercicio(u, supino);
    expect(h.map((x) => [x.data, x.series.map((y) => y.cargaKg)])).toEqual([
      ["2026-07-10", [40, 40, 37.5]],
      ["2026-07-03", [38, 38]],
    ]);
    const detalhe = await treinoDoUsuario(u, t2);
    expect(detalhe!.exercicios.map((e) => e.nome)).toEqual([
      "Flexão",
      "Supino",
    ]);
    expect(detalhe!.exercicios[0]!.series[0]!.cargaKg).toBeNull();
    expect((await treinosDoUsuario(u)).map((t) => t.data)).toEqual([
      "2026-07-10",
      "2026-07-03",
    ]);
  });

  it("editar substitui as séries e excluir não mexe no catálogo", async () => {
    const u = await novoUsuario("2026-10-19");
    const supino = await novoExercicio(u, "Supino");
    const remada = await novoExercicio(u, "Remada");
    const t = await registrar(
      u,
      sessao("2026-10-20", [{ exercicioId: supino, series: [s(10, 40)] }]),
    );

    await registrar(
      u,
      sessao("2026-10-21", [{ exercicioId: remada, series: [s(12, 30)] }]),
      t,
    );
    expect(await historicoDoExercicio(u, supino)).toEqual([]);
    expect((await historicoDoExercicio(u, remada))[0]!.data).toBe("2026-10-21");
    // Continua "usado" enquanto um modelo ou treino o referencia.
    expect(await exercicioUsado(supino)).toBe(false);
    expect(await exercicioUsado(remada)).toBe(true);

    await excluirTreino(u, t);
    expect(await treinoDoUsuario(u, t)).toBeNull();
    expect(await exerciciosDoUsuario(u)).toHaveLength(2);
  });

  it("o banco impede apagar exercício usado", async () => {
    const u = await novoUsuario("2026-10-19");
    const supino = await novoExercicio(u, "Supino");
    await registrar(
      u,
      sessao("2026-10-20", [{ exercicioId: supino, series: [s(10)] }]),
    );
    await expect(
      db().delete(exercicio).where(eq(exercicio.id, supino)),
    ).rejects.toThrow();
  });

  it("não aceita exercício nem treino de outro usuário", async () => {
    const dono = await novoUsuario("2026-10-19");
    const outro = await novoUsuario("2026-10-19");
    const supino = await novoExercicio(dono, "Supino");
    const t = await registrar(
      dono,
      sessao("2026-10-20", [{ exercicioId: supino, series: [s(10)] }]),
    );

    const id = await db().transaction((tx) =>
      gravarTreino(
        tx,
        outro,
        sessao("2026-10-20", [{ exercicioId: supino, series: [s(1)] }]),
        null,
      ),
    );
    expect(id).toBeNull();
    expect(await treinoDoUsuario(outro, t)).toBeNull();
    await excluirTreino(outro, t);
    expect(await treinoDoUsuario(dono, t)).not.toBeNull();
  });

  it("editar ou excluir o modelo não muda o treino feito com ele", async () => {
    const u = await novoUsuario("2026-10-19");
    const supino = await novoExercicio(u, "Supino");
    const modelo: ModeloValido = {
      nome: "Peito",
      observacao: null,
      exercicios: [
        { exercicioId: supino, seriesSugeridas: 3, repsMin: 8, repsMax: 12 },
      ],
    };
    const m = (await db().transaction((tx) =>
      gravarModelo(tx, u, modelo, null),
    ))!;
    const t = await registrar(
      u,
      sessao("2026-10-20", [{ exercicioId: supino, series: [s(10, 40)] }], m),
    );

    await db().transaction((tx) =>
      gravarModelo(tx, u, { ...modelo, nome: "Peito novo" }, m),
    );
    expect((await treinoDoUsuario(u, t))!.modelo!.nome).toBe("Peito novo");
    await excluirModelo(u, m);
    const depois = await treinoDoUsuario(u, t);
    expect(depois!.modelo).toBeNull();
    expect(depois!.exercicios[0]!.series).toEqual([s(10, 40)]);
    const [linha] = await db().select().from(treino).where(eq(treino.id, t));
    expect(linha!.modeloId).toBeNull();
  });
});

comBanco("catálogo inicial", () => {
  it("semeia uma vez só e não duplica um nome que a conta já tem", async () => {
    const u = await novoUsuario("2026-10-19");
    await novoExercicio(u, "supino  RETO");
    await semearExercicios(db(), u);
    await semearExercicios(db(), u);
    const nomes = (await exerciciosDoUsuario(u)).map((e) => e.nome);
    expect(nomes).toHaveLength(EXERCICIOS_INICIAIS.length);
    expect(nomes).toContain("supino RETO");
    const stiff = (await exerciciosDoUsuario(u)).find(
      (e) => e.nome === "Stiff",
    );
    expect(stiff?.grupo).toBe("posteriores");
    expect(nomes).not.toContain("Supino reto");
  });
});

comBanco("projeto em foco num dia passado", () => {
  it("é a última troca até a data, sem olhar as posteriores", async () => {
    const u = await novoUsuario("2026-10-19");
    const [a, b] = await db()
      .insert(projeto)
      .values([
        { usuarioId: u, nome: "A", dataInicio: "2026-10-01" },
        { usuarioId: u, nome: "B", dataInicio: "2026-10-01" },
      ])
      .returning({ id: projeto.id });
    await db()
      .insert(projetoAtualTroca)
      .values([
        { usuarioId: u, projetoId: a!.id, data: "2026-10-10" },
        { usuarioId: u, projetoId: null, data: "2026-10-15" },
        { usuarioId: u, projetoId: b!.id, data: "2026-10-20" },
      ]);

    expect(await projetoEmFoco(u, d("2026-10-09"))).toBeNull();
    expect((await projetoEmFoco(u, d("2026-10-12")))!.nome).toBe("A");
    expect(await projetoEmFoco(u, d("2026-10-16"))).toBeNull();
    expect((await projetoEmFoco(u, d("2026-10-20")))!.nome).toBe("B");
  });
});
