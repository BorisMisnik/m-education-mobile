var app = {
	allQuestions : [],
	// Application Constructor
	getThemes : function(){ // get list all themes
		var view = {themes : []};
		app.allQuestions = []; //reset all questions
		// pase query
		var Score = Parse.Object.extend('Tests');
		var query = new Parse.Query(Score);
		// html template
		var template = $('#themes')[0].innerHTML;
		var self = this;
		// query 
		query.equalTo();
		// this.preloader();
		query.find({
			success : function(result){ // responde
				var max = result.length,
					i = 0;
				for (; i < max; i++) {
					var object = result[i];
					var obj = {
						title : object.get('title'),
						id : object.id,
						description : object.get('about')
					};
					view.themes.push(obj);
					$('#themes').listview('refresh'); // update listciew
				};
				self.renderTemplate(template, view, '#themes');
				// self.preloaderHide();
			},
			error : function(error){ // error responde
				console.log('error')
			}
		});

	},
	renderTemplate : function(template, view, id){ // render template 
		var output = Mustache.to_html(template, view); // mustache template
		if( id !== '' ){
			$(id).html(output).show(); // append html
			$(id).show();
		}
		else
			return output; //return result
			
	},
	testDescription : function(params){ // write test description
		var view = {
			description : params.testDescription,
			testId : params.id,
			title : params.testTitle
		};
		var template = $('#descriptionTest').html();
		this.renderTemplate(template, view, '#descriptionTest');
		$('#descriptionTest').addClass('show');
	},
	getAllQuestion : function(id){
		var Score = Parse.Object.extend('Test');
		var query = new Parse.Query(Score);
		var self = this;
		query.equalTo('testId', id);
		query.find({
			success : function(data){
				var max = data.length,
					i = 0;
				for (; i < max; i++) {
					var question = {};
					var object = data[i];

					question.question = object.get('question');
					question.answer = object.get('answer').split('|');
					question.file = object.get('file').url();
					question.confirmAnswer = object.get('confirmAnswer');
					question.index = i;
					question.userAnswer = '';
					// add confirm answer to all answers
					question.answer.push(question.confirmAnswer);
					self.allQuestions.push(question);

				};
				// sort answer
				self.sortAnswers();
				// sort questions
				self.sortQuestions();
				// crate question
				self.createQuestion();
			},
			error : function(error){
				console.log(error);
			}
		});
	},
	sortAnswers : function(){
		var array = this.allQuestions;
		for (var i = 0; i < array.length; i++) {
			array[i].answer = this.sortArray(array[i].answer);
		};
	},
	sortQuestions : function(){
		this.allQuestions = this.sortArray(this.allQuestions);
	},
	createQuestion : function(){
		var array = this.allQuestions;
		var step = +app.step;
		var html = $('#testPage')[0].innerHTML;
		var view = {
			question : array[step].question,
			file : array[step].file,
			confirmAnswer : array[step].confirmAnswer,
			answer :  array[step].answer,
			nextStep : step + 1 > array.length - 1 ? array.length - 1 : step + 1,
			userAnswer : array[step].userAnswer
		}
		var output = this.renderTemplate(html, view, '');
		// replace html
		$('#testPage').replaceWith(output);

		var userAnswer = view.userAnswer;
		$('[type=radio]').each(function(){
			if( $(this).val() === userAnswer ){
				$(this).attr('checked', 'checked');
			}
		});
		$('h4').hide();
		$('[type=radio]').checkboxradio().trigger('create');
		$('[data-role=controlgroup]').controlgroup().trigger('create');

	},
	sortArray : function(array){
		for (var i = array.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	},
	writeAnswer : function(form){
		var confirmAnswer = form.attr('data-confirmAnswer');
		var answer;
		form.find('[type=radio]').each(function(){
			if( $(this).is(':checked') )
				answer = $(this).val();
		});
		if( !answer ) return;

		this.allQuestions[app.step].userAnswer = answer;
		if( answer === this.allQuestions[app.step].confirmAnswer ){
			this.allQuestions[app.step].success = true;
		}		
	},
	createResult : function(){
		var answers = this.getConfirmAnswers();
		var rating = this.getRating(answers);
		var html = $('#result').html();
		var view = {
			answer : answers,
			questions : app.allQuestions.length,
			rating : rating
		}
		// render template
		console.log(html)
		console.log(view)
		var output = this.renderTemplate(html, view, '');
		console.log(output);
		$('#result').replaceWith(output).show();

	},
	getConfirmAnswers : function(){
		var array = this.allQuestions;
		var number = 0;
		for (var i = 0; i < array.length; i++) {
			if( array[i].success )
				number++;
		};
		return number;
	},
	getRating : function(answers){
		var allQuestions = this.allQuestions.length;
		var procent = answers * 100 / allQuestions;
		return Math.floor(procent);
	}
};
$(document).on('mobileinit', function(){
	var $document = $(this);

	$document.on('pagechange', function(e, data){
		var location = $.mobile.path.getLocation();

		if( location.indexOf('index.html') > 0 )
			app.allQuestions = [];
		else if( location.indexOf('result.html') > 0 )
			app.createResult();
	});	

	$document.on('click', '.next-step', function(e){
		if( +app.step + 1 === app.allQuestions.length){
			e.preventDefault();
			$.mobile.changePage('result.html', {transition: 'slide'});
		}	
	});

	$document.on('click', '#openPopup', function(e){
		e.preventDefault();
		$(this).popup('open');
	});

	$document.on('click', '#answer', function(e){
		e.preventDefault();
		var form = $document.find('form');
		app.writeAnswer(form);
		$('h4').show();
	});


});
// init parse
Parse.initialize('hCfZBoZFJgZYnw0m03Vzf3Wk1PDCV1tUGbMYHnHs', 'Q98bVrTOHLTp16AdkWx8CxRx3jYrjlrli1DvkuzI');
// routing
var router = new $.mobile.Router({
		'/index.html': {
			handler: 'MainPage', events: 'i', argsre: true
		},
		'/templates/testDecription.html' : {
			handler : 'TestDescription',
			events : 'i',
			argsre: true
		},
		'/templates/test-template.html' : {
			handler : 'TestQuestion',
			events : 'i',
			argsre : true
		}

	}, 
	{
		MainPage: function(type, match, ui, page, e){ // index.html handler
			app.getThemes(); // git list themes
		},
		TestDescription : function(type,match,ui){ // /templates/testDescription.html handler
			var params=router.getParams(match[1]); // render url
			app.testDescription(params); // write test description
		},
		TestQuestion : function(type,match,ui){ // /templates/test-template.html handler
			var params=router.getParams(match[1]); // render url
			app.step = params.step; // step  question
			if( app.allQuestions.length === 0 )
				app.getAllQuestion(params.id); // get all question by id 
			else
				app.createQuestion();
		},
		Result : function(){ // templates/result.html handler
			app.createResult();
			console.log(13123)
		}
	}, 
	{ 
		ajaxApp: true,
		defaultHandler: function(type, ui, page) {
			console.log("Default handler called due to unknown route (" 
			  + type + ", " + ui + ", " + page + ")");
		},
		defaultHandlerEvents: "s"
	}
);