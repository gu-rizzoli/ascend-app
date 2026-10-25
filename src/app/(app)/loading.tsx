/**
 * O desenho da tela enquanto os dados chegam, para o toque num link nunca
 * parecer perdido. As abas da barra e os dias vizinhos já vêm carregados e
 * nem passam por aqui.
 */
export default function Carregando() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="animate-pulse">
      <div className="h-7 w-40 rounded-md bg-neutral-200" />
      <div className="mt-4 h-10 rounded-lg bg-neutral-100" />
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
