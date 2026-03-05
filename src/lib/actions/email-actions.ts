"use server";

type ReportCardEmailParams = {
    studentName: string;
    parentEmail: string;
    parentName: string;
    globalAverage: string;
};

export async function sendReportCardEmail(params: ReportCardEmailParams) {
    try {
        console.log(`[EMAIL MOCK] Enviando boletim de ${params.studentName} para ${params.parentEmail}...`);

        // Simular um atraso de rede (ex: chamando Resend, Sendgrid, etc)
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log(`[EMAIL MOCK] Email enviado com sucesso!`);
        console.log(`[EMAIL MOCK] Conteúdo Simulado:
        Olá ${params.parentName},
        
        O boletim atualizado do(a) aluno(a) ${params.studentName} já está disponível.
        A média global atual é: ${params.globalAverage}.
        
        O PDF com os detalhes das notas segue em anexo.
        
        Atenciosamente,
        Secretaria da Escola
        `);

        return { success: true };
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        return { success: false, error: "Falha ao enviar o email de boletim." };
    }
}
