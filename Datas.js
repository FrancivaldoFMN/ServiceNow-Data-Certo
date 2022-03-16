(function executeRule(current, previous /*null when async*/) {

	try{
		var log = 'Bloquear Lançamento De Ponto Retroativo' + '\n'; // varaivel log que recebera os dados que as varaiveis contem 
		
		var mens = ''; // varaivel que sera utilziada para apresentar as mensagens no catalogo quando for satisfeita a logica

		var dataLancamento = new GlideDateTime();// data e hora do dia de hoje

		log += '\n' + 'Data de Hoje: ' + dataLancamento + '\n'; 

		var dataLicenca = current.u_start_date.getDisplayValue(); // varaivel que ira conter o valor da variavel do catalog de serviço

		log += '\n' + 'Data fornecida: ' + dataLicenca + '\n';


		var dataForm = new GlideDateTime(); 
		dataForm.setDisplayValue(dataLicenca);
		dataForm.addSeconds(-10800); 
		// varaivel que ira conter o valor da varaivel 'dataLicenca' e transformala no padrao que e usado em GlideDateTIme 'yyyy/mm/dd 00:00:00' e sera retirado 3 horas da variavel

		log += '\n' +'Transforma data: ' + dataForm + '\n';

		var dataPodeInicio = new GlideDateTime();
		dataPodeInicio.setValue(dataLancamento);
		dataPodeInicio.addMonths(-1);
		dataPodeInicio.setValue('' + dataPodeInicio.getYear() + '-' + dataPodeInicio.getMonth() + '-15 00:00:01');			
		// a varaivel dataPodeInicio e utilizada para ser usada como referencia do ciclo anterior, no qual se inicia no dia 15 do mes anterior ao qual voce se encontra agora
		
		log += '\n' + 'dataPodeInicio: ' + dataPodeInicio + '\n';

		var dataPodeFim = new GlideDateTime();
		dataPodeFim.setValue('' + dataLancamento.getYear() + '-' + dataLancamento.getMonth() + '-17 00:00:01');
		// dataPodeFim e a data do dia 17 do mes atual que se finaliza o ciclo

		var dia_inicial = 16;
		var dia_a_acrescentar = diasUteis(dataPodeFim); //variavel que ira conter toda a logica da funcao 'diasUteis'
		var dia_final = dia_inicial + dia_a_acrescentar; // variavel que ira somar o valor 16 com o valor que vira da funcao
		
		dataPodeFim.setValue('' + dataLancamento.getYear() + '-' + dataLancamento.getMonth() + '-' + dia_final + ' 23:59:59');
		// como a demanda pede para acrescentar 5 dias uteis, a soma realziada anteriormente sera utilizada para o acrescimo de dias necessarios para determianr ate que data poderá ser lancada a ausencia

		log += '\n' + 'dataPodeFim: ' + dataPodeFim + '\n';

		var dataPodeCicloAtual = new GlideDateTime(); //
		dataPodeCicloAtual.setValue('' + dataLancamento.getYear() + '-' + dataLancamento.getMonth() + '-16 00:00:00');		

		log += '\n' + 'dataPodeCicloAtual: ' + dataPodeCicloAtual + '\n';

		var dataPodeFimAtual = new GlideDateTime();
		dataPodeFimAtual.setValue(dataLancamento);
		dataPodeFimAtual.addMonths(+1);
		dataPodeFimAtual.setValue('' + dataLancamento.getYear() + '-' + dataPodeFimAtual.getMonth() + '-17 00:00:01');
		// dataPodeFimAtual contem a data do novo ciclo que se inicia, que como ele se inicia dia 15 do mes anterior ele pode ir ate o dia 16 do proximo mes, isso com base no mes em que voce se encontra, supondo que voce se encontra no mes de marco '03' e voce esta no dia 13/03 dessa forma o ciclo se inicio dia 15/02 e a data fim e o dataPodeFimAtual
		

		dia_inicial = 16;
		dia_a_acrescentar = diasUteis(dataPodeFimAtual);
		dia_final = dia_inicial + dia_a_acrescentar;

		dataPodeFimAtual.setValue('' + dataLancamento.getYear() + '-' + dataPodeFimAtual.getMonth() + '-' + dia_final + ' 23:59:59');
		
		// a varaivel dataPodeFimAtual ira determinar quando sera o fim do proximo ciclo

		log += '\n' + 'dataPodeFimAtual: ' + dataPodeFimAtual + '\n';


		if(dataLancamento < dataPodeCicloAtual && dataLancamento >= dataPodeInicio) { // Está somente no primeiro ciclo

			if(dataForm > dataPodeInicio && dataForm < dataPodeFim){
				mens = gs.addInfoMessage('1-AUTORIZADO');
				log += '\n' + 'Primeiro ciclo verdadeiro' + '\n';

			}else{	
				mens = gs.addErrorMessage('1-ATENÇÃO: Você ultrapassou o prazo para cadastrar esta ocorrência');
				current.setAbortAction(true);
				log += '\n' + 'Não respeitou o primeiro ciclo' + '\n';
				
			}
		}else if(dataLancamento <= dataPodeFim && dataLancamento >= dataPodeCicloAtual) { // Está nos dois ciclos

			if(dataForm >= dataPodeInicio && dataForm <= dataPodeFimAtual){
				mens = gs.addInfoMessage('2-AUTORIZADO');
				log += '\n' + 'Esta nos dois ciclos' + '\n';

			} else{
				mens = gs.addErrorMessage('2-ATENÇÃO: Você ultrapassou o prazo para cadastrar esta ocorrência');
				current.setAbortAction(true);
				log += '\n' + 'Não respeitou os dois ciclos' + '\n';


			}
		}else if(dataLancamento >= dataPodeCicloAtual && dataLancamento <= dataPodeFimAtual){ // Está no segundo ciclo

			if(dataForm >= dataPodeCicloAtual && dataForm <= dataPodeFimAtual){
				mens = gs.addInfoMessage('3-AUTORIZADO');
				log += '\n' + 'Segundo ciclo verdadeiro' + '\n';

			}else{			
				mens = gs.addErrorMessage('3-ATENÇÃO: Você ultrapassou o prazo para cadastrar esta ocorrência');
				current.setAbortAction(true);
				log += '\n' + 'Não respeitou o segundo ciclo' + '\n';

			}

		}else{
			mens = gs.addErrorMessage('0-ATENÇÃO: Você ultrapassou o prazo para cadastrar esta ocorrência');
			current.setAbortAction(true);
			log += '\n' + 'Não esta em nenhum ciclo' + '\n';

		} 

	}catch(err){
		current.setAbortAction(true); //caso de nehum dos ifs seja satisfeito abortara no catalog de servico
		log += 'ERRO: ' + err.message; // e apresentara uma mensagem de erro no log

	}finally{

		gs.log(log); // ira mandar as ifnormacoes para a tabela de log

	}

	function diasUteis(dataPodeFim){ // function que ira fazer toda a logica de 5 dias uteis para acresentar ao final do ciclo 

		var log = '\n' + 'Array das datas' + '\n';

		var dia_a_acrescentar = 5; //varaivel que contem o valor da quantidade de dias que sera adicionado 5 dais uteis

		var dia_inicial = 17;
		// o dia inicial dos dias uteis sempre sera no dia 17 pois no dia 16 e o final do ciclo

		var data_atual = dataPodeFim; // a dataPodeFim que e utilizada para determianr o dia em que se inicia os dias uteis

		dia_inicial = dia_inicial + 1; // feito para ir somando mais 1 dia ao dia inicial dos dias uteis
		var data_atual1 = new GlideDateTime();
		data_atual1.setValue('' + data_atual.getYear() + '-' + data_atual.getMonth() + '-' + dia_inicial + ' 00:00:01'); // tratativa da data par aficar no formato certo, e acrescenta mais 1 dia ao dia 17 

		dia_inicial = dia_inicial + 1;
		var data_atual2 = new GlideDateTime();
		data_atual2.setValue('' + data_atual.getYear() + '-' + data_atual.getMonth() + '-' + dia_inicial + ' 00:00:01'); // tratativa da data par aficar no formato certo, e acrescenta mais 1 dia ao dia 17

		dia_inicial = dia_inicial + 1;
		var data_atual3 = new GlideDateTime();
		data_atual3.setValue('' + data_atual.getYear() + '-' + data_atual.getMonth() + '-' + dia_inicial + ' 00:00:01'); // tratativa da data par aficar no formato certo, e acrescenta mais 1 dia ao dia 17

		dia_inicial = dia_inicial + 1;
		var data_atual4 = new GlideDateTime();
		data_atual4.setValue('' + data_atual.getYear() + '-' + data_atual.getMonth() + '-' + dia_inicial + ' 00:00:01'); // tratativa da data par aficar no formato certo, e acrescenta mais 1 dia ao dia 17

		var array = [0,1,2,3,4]; // criacao da array para conter as datas dos 5 dias uteis contanto a partir do dia 17 

		array[0] = data_atual;
		log += '\n' + array[0] + '\n';

		array[1] = data_atual1;
		log += '\n' + array[1] + '\n';

		array[2] = data_atual2;
		log += '\n' + array[2] + '\n';

		array[3] = data_atual3;
		log += '\n' + array[3] + '\n';

		array[4] = data_atual4;
		log += '\n' + array[4] + '\n';
		
		// cada ray contera uma data ja pre-estabelecida com as variaveis anteriores das datas

		for (var i = 0; i < array.length; i++){
			var numero_dia = array[i].getDayOfWeekUTC();  // esse metodo identifica qual o numero responsavel pela aquela data, um exemplo e que dia 17 caia numa segunda então seu numero correspondente e 1

			log += 'Número de hoje: ' + numero_dia + '\n';

			if (numero_dia == 6) { 

				dia_a_acrescentar += 2;

			}else if (numero_dia == 7 && dia_a_acrescentar == 5){

				dia_a_acrescentar += 1;

			} // uma logica if que se identificar o numero 6 ou 7 irá acrescentar mais dias aos dias uteis, pois 6 e 7 e final de semana 'sabado e domingo' dessa forma não conta como dia util e se durante o laco de repeticao encontrar algum desses numeros na repeticao entrara na logica e acresentara oa dias conforme

			log += 'Quantos dias aé agora: ' + dia_a_acrescentar + '\n';

		}

		log += 'Dia acrescentado' + dia_a_acrescentar + '\n';

		return dia_a_acrescentar;

	}

})(current, previous);